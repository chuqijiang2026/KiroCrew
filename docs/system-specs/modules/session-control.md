# Session Control Module

## Overview

Session control lets one of the user's chat sessions act on another: send it a
message, stop its in-flight turn, and read its transcript. It exists because
context does not travel between sessions. A session that has spent an hour on a
PR knows things a fresh session would have to be told, and today the only way to
move that knowledge is for the human to retype it. Session control makes the
session that already holds the context hand the work over directly.

Four MCP tools on `kirocrew-dashboard`, four strict-internal routes, one config
switch. Every route is on `_STRICT_INTERNAL_API_PATHS`; an unlisted one is
unreachable in production because the caller's `X-Internal-Secret` is ignored.

| Tool | Route | What it does |
|------|-------|--------------|
| `session_create` | `POST /api/session-control/create` | Open a new session owned by the caller |
| `session_message_send` | `POST /api/session-control/send` | Deliver a message to a session it created, as a user turn |
| `session_stop` | `POST /api/session-control/stop` | Stop another session's in-flight turn |
| `session_read_message` | `GET /api/session-control/read` | Read another session's transcript tail + liveness |

`kirocrew-dashboard` rather than `kirocrew-core`, because these tools are not a
capability every session should carry. That server is an **assignable set**: it
is absent from the default agent's spec and loads only for an agent whose own
spec references it, so an ordinary session spends no context on tools it will
never call. The set already holds the chat-folder tools, and the two classes are
granted together on purpose — an agent given the job of organizing sessions is
the same agent that should be able to hand work between them. A test pins that
bundling so neither half can leave the set unnoticed.

Discovery is not new: `list_sessions` already enumerates the caller's sessions,
and its keys are what `target` accepts.

## Two properties that shape everything else

### Delivery is a user turn, not an injection

A delivered message arrives on the target's **normal input path** — the same one
a person typing in that tab uses. There is no side channel that writes into the
transcript behind the turn lifecycle's back. Concretely, `send` picks one of
three landings and reports which:

| Target state | `mode` | Landing | `delivered` |
|--------------|--------|---------|-------------|
| Running a turn | `steer` (default) | Interrupts the running turn via the live ACP client | `steered` |
| Running a turn | `steer`, but the client refuses or cannot steer | Falls through to the queue | `queued` |
| Running a turn | `queue` | Queue, without touching the running turn | `queued` |
| Idle | either | Appends the user message and starts a turn | `started` |

This matters beyond tidiness. Because delivery goes through the ordinary path,
everything built on that path keeps working on a controlled session: Stop still
cancels it, the queue still drains it, the context meter still counts it, the
transcript still shows it, and a page reload still finds it. An injection that
bypassed the turn would have to re-implement each of those, and would diverge
from all of them on the next change.

**A queued relay is authorized twice.** Queueing splits delivery into two moments,
and `authorize_target` only covers the first, so the drain re-checks the one
refusal that can change while an entry waits: the target's channel binding, which
any user can add at any time. Suppressing the text mirror does not make that safe
on its own -- the relay's text stays off the linked surface, but the turn's REPLY
is still delivered there -- so a relay whose target became channel-linked,
mirrored, or crew-mode is dropped at the drain with a row left in the transcript
and a SEL `denied` line, rather than reaching that channel's audience by waiting.
The re-check is deliberately narrower than the send-time gate: re-running the
whole thing would refuse for reasons that cannot apply to an already-accepted
message (a caller session since closed, the send cooldown) and would silently
discard legitimate work.

The steer and queue bookkeeping is **shared with `POST /api/chat`**, not
duplicated: both call `steer_into_running_turn` / `queue_for_next_turn` in
`dashboard/chat_delivery.py`. That sharing is load-bearing, because the ordering
rules there are subtle and a second copy would drift:

- The pending steer is registered **before** the steer RPC is awaited. `steer()`
  suspends on `stdin.drain()`, and if the turn's teardown runs during that
  suspension it must already see the steer in order to requeue it. Appending
  after the await would land on an idle slot and orphan the message.
- A refused steer **unwinds** that registration before the caller queues. If the
  entry is already gone, something consumed it during the await — the turn's
  teardown requeued it, or the running turn took it, or a hard kill cleared it —
  so the message is accounted for and queueing again would deliver it twice.
  `steer_into_running_turn` reports which: `STEER_UNAVAILABLE` (the client refused
  the write — queue it), `STEER_REQUEUED` (the teardown moved it into the queue —
  do not queue it again, it will run), and `STEER_STEERED` (delivered; this
  function persists the row itself). The queue is what separates a requeue from
  everything else: teardown moves unconsumed steers into it, a hard stop clears it.
- **Nothing on this path tells a caller to resend.** A registration can vanish
  because a hard kill cleared it OR because the running turn consumed the steer,
  and from inside the reconciliation those are the same observation — so a stop
  racing the RPC resolves as delivered and the text is persisted rather than
  dropped. Reporting a discard there would make the caller resend an instruction
  the target may already have executed, and an unattended caller retries on its
  own; a persisted row for a killed turn is the cheaper error, and it keeps the
  message visible instead of losing it silently. The `delivery_discarded` refusal
  that `send` can still raise belongs to the **detached-slot** checks, where the
  loss is provable: the slot the row was appended to is no longer wired into
  state, so the reply has nowhere to surface.
- Both lists are compared by **count**, never by membership. Identical text can
  already be pending (another caller's live steer) or already be queued (an
  unrelated earlier entry), and `message in list` cannot tell whose entry it is.
  A pending count that falls back means ours left; a queue count that rises means
  ours landed there. Reading mere presence in the queue as "our requeue" drops the
  transcript row for a message the turn genuinely consumed.
- `send` verifies the target is **still the same live slot** after the await
  (`state.get_slot(key) is slot`) before reporting success. A tab closed mid-steer
  leaves the delivery on a detached object where neither the row nor the reply can
  surface, so it answers 409 `delivery_discarded`. The check is identity, not
  `is None`: a same-key slot recreated during the await is a different
  conversation, and delivering into it would be worse than losing the message.
- **At most one pending steer per distinct text**, enforced before the RPC. Every
  consumer of `_pending_steers` matches by CONTENT (the teardown requeues by
  content, the queue comparison matches by content), so with two identical entries
  in flight nothing downstream can say whose survived: if another caller's copy is
  consumed while ours is refused, the count falls back exactly as it would had ours
  gone, and a refused message gets persisted as delivered and then requeued. So a
  second identical steer is refused up front with `STEER_UNAVAILABLE` and its caller
  queues instead — nothing is lost. Because a concurrent caller hits the same guard,
  once an entry is appended no further identical entry can appear, and that is what
  makes every post-await check unambiguously about the caller's own entry.
- Each in-flight steer carries an opaque **delivery id** (`_ChatSlot._steer_delivery_ids`,
  keyed by text because the one-per-text rule makes that key unique). The requeue moves
  the id onto the queue entry, and the drain unions entry meta onto the row it appends —
  so a row carrying the id proves the delivery is **already persisted**, even when the
  drain merged several queued messages into one row where no content comparison would
  match. That check runs first, because it is the only signal that survives every
  transition: the full requeue-then-drain sequence can complete while the RPC is
  suspended, leaving the entry in neither list and otherwise indistinguishable from the
  running turn having consumed it. Bare text cannot make that distinction, which is why
  the id exists rather than another content comparison.
- The send cooldown is a **claim, not an observation**: `_last_send` is recorded
  before the first await, past every refusal that can still reject the send. Delivery
  suspends, so two sends that both read the map before either suspended would both
  steer and the target would take a burst inside the window the cooldown exists to
  prevent. The delivery failure paths release the claim again, so a discarded or
  detached send does not lock the target out for the rest of the window.
- **Absence is never read as loss.** A raised `steer()` does not imply the text
  was lost — `stdin.drain()` can fail after the bytes reached the child — and a
  missing registration does not either, because the running turn consuming the
  steer removes it exactly as a requeue or a hard kill would. Every path here is
  accounted for by somebody, so none of them asks the caller to resend: trusting
  the exception, or reading the emptied list as a discard, would make the caller
  send a message the target already has.
- Cursor positions are exact only while nothing has been trimmed. `_disk_older_count`
  counts every trimmed row including transient ones, while indexes here are built
  over durable rows only, so once a transient row ages into the frozen prefix the
  two disagree and a `since` read would repeat a durable message. Rather than
  duplicate silently, a `since` read on a trimmed session answers 409
  `cursor_unavailable` and the response omits `next_since` in favour of
  `cursor_exact: false`; tail reads (no `since`) keep working. The window is 10,000
  rows, so only a long-lived session reaches this. The real fix needs a
  durable-only prefix counter, which belongs to persistence — tracked in #2474.
- On a successful steer the in-flight text segment is cut at the steer boundary
  **before** the user message is persisted, so the transcript reads
  `[assistant(pre-steer), user(steer), …]` — the order the client rendered live.

### Provenance is never hidden

The delivered text is prefixed with one line naming the sending session:

```
[from session: Watchdog work]
stop rebasing, I took that commit
```

This is in the **content**, not display-only metadata, because the receiving
model reads content and it is the party that most needs to know the turn came
from a peer rather than the human. A session that could type as the user would
be an impersonation primitive; the label is what makes it a handoff instead. The
persisted message additionally carries `meta.session_control.from_slot` /
`from_title` for display attribution.

## Authorization

Deny-by-default, and checked in **one** place — `authorize_target` — for the
three verbs that take a target, so a guard cannot be present on `send` and
missing on `read`. (`session_create` has no target to authorize; it checks the
caller's own eligibility with the same refusals.) Every
refusal is recorded in the SEL as `session_control.<op>` with `outcome=denied`,
so an attempt to reach a session that is out of bounds is visible after the fact
even though nothing happened.

| Refusal | Status | Why |
|---------|--------|-----|
| Config switch off (`agent.session_control`) | 403 | Operator opted out |
| Caller session cannot be identified | 403 | An unidentifiable caller makes the self-send guard blind |
| Caller is an unattended session (`cron-*`, `workflow-*`) | 403 | A scheduled job typing into live conversations is not a handoff |
| Caller is itself incognito, temporary, or app-scoped | 403 | Caller-side isolation — the direction the target-side checks cannot see |
| Caller is channel-linked (`linked_session_key` set) | 403 | The exfiltration direction: a linked caller's conversation IS a channel thread, so a read would hand a private dashboard transcript to that channel's readers. `CHANNEL_AGENT_BLOCKED_TOOLS` keys on the agent identity; a linked slot is a second route to the same surface |
| Caller's own session is no longer open | 403 | Nothing to attribute the message to |
| Target is the caller | 403 | Self-send is a loop with no exit |
| Target is unattended (`cron-*`, `workflow-*`) | 403 | A `workflow-<run_id>` slot is display-only and a cron's turns are driven by a schedule; a message there starts a turn nobody reads |
| Target is incognito or temporary | 403 | Never addressable, matching `list_sessions` |
| Target is app-scoped | 403 | App sessions are the app's, not a peer's |
| Target is channel-linked (`linked_session_key` set) | 403 | Its conversation is mirrored to Slack/Telegram, so reaching it crosses a surface boundary both ways — and its stop cannot be honoured, because the stop path addresses `dashboard:<slot>` while a linked slot's turns run under its linked key |
| Target or caller has an outbound channel mirror (`get_mirror_link`) | 403 | The same boundary reached by the other mechanism. `linked_session_key` marks a channel-BORN slot; a dashboard-born slot given a mirror link republishes its turns to a channel just as surely, and the link lives in the session store rather than on the slot, so the slot-side check reads empty on exactly the session that mirrors |
| Target is a crew-mode session (`mode == "crew"`) | 403 | A crew session's ingress is not a turn: `/api/chat` routes it to `state.crew.ingest`, which makes the message a durable queue entry and fans it out to topic sub-sessions. Delivering it here as a turn would run generic work that is neither queued nor routed, and would report success for it. Refused rather than emulated — a target whose ingress contract differs needs its own path, not a second copy of the orchestrator's rules |
| Target is in another workspace | 403 | Workspaces are the memory boundary |
| Target names no open session | 404 | A mistake, not an authorization failure |
| Title matches more than one session | 409 | Guessing means delivering to the wrong conversation |

Two notes on scope:

- **Only sessions the dashboard currently holds are addressable.** A closed tab
  is out of reach on purpose — waking one would resurrect a conversation the
  user put away. This is narrower than `list_sessions`, which also lists history.
- **All four tools are on
  `CHANNEL_AGENT_BLOCKED_TOOLS`, including the read.** A channel agent is
  contained to channel posts, and session control crosses that boundary in both
  directions: send / stop reach the user through one of their dashboard
  transcripts, and `session_read_message` pulls a private dashboard conversation
  into a channel other humans can see. Containment is about what crosses the
  boundary, not about who writes, so the read is blocked alongside the writes.

All four tools additionally require a **signed** caller identity
(`_resolve_session_key_strict`), not the lenient `/proc` ancestor walk. A
subagent spawned by `spawn_run` lives under its parent slot's process tree, so
the walk resolves it to the parent — and since authorization here is entirely
"what may this session reach", that would let a subagent read, message, or stop
the parent's sibling sessions. A caller the gateway issued no key to is refused
with an explanation rather than silently borrowing one.

The routes are **strict-internal** (`_STRICT_INTERNAL_API_PATHS`): loopback plus
`X-Internal-Secret`, with no cookie fall-through. No browser calls them, and they
are the entry point to typing into, stopping, and reading another live
conversation — a cookie path there would be a new authorization surface rather
than a convenience. The MCP process holds the secret; an agent's own sandbox does
not (`KIROCREW_INTERNAL_SECRET` is stripped from agent env), which is why these
are tools rather than something an agent can curl.

Each handler **re-asserts** `request["internal_auth"] is True` rather than
trusting the path classification. Strict is not self-enforcing at the handler:
with the header absent the middleware falls through to cookie auth, and a
`local_only=False` deployment reclassifies strict paths as mixed. Because these
routes authorize on the `X-Session-Key` the caller supplies, a same-origin page
holding only a dashboard cookie could otherwise act **as** any of the user's
sessions. `internal_auth` is set only after a constant-time secret match, so one
check closes the cookie path, the app-token path, and the non-loopback
reclassification together. The same reasoning is why
`/api/computer-use/frame` re-asserts it.

The config read fails **closed**: `KiroCrewConfig.load()` raising resolves to
disabled rather than to the field's (enabled) default, so malformed config in an
unrelated section cannot silently undo an explicit `session_control: false`.

## Flood control

Two bounds, both on the **target**, because the resource being protected is the
target's attention and context window:

- **Cooldown** — `SEND_COOLDOWN_SECS` (3s) minimum gap between sends to one
  session; a tighter caller gets 429. The bookkeeping map prunes expired rows on
  every check, so it stays bounded on a long-lived gateway rather than retaining
  a row per target forever.
- **Queue depth** — at `MAX_QUEUE_DEPTH` (5) waiting messages, further sends are
  429. A target that is not draining does not need more text.

Message size is capped at `MAX_MESSAGE_CHARS` (8000). Reads cap at 100 messages
and truncate any single message at `MAX_READ_CONTENT_CHARS` (4000), flagging the
row with `truncated: true`.

Redaction order is load-bearing in both directions:

- **Outbound**, the handoff body is scrubbed *before* the attributed text is
  built, because that text reaches the target's **provider** (`client.steer`,
  `_run_chat`) and not just its transcript. Scrubbing at the persist site alone
  would hand the model a raw credential and keep the clean copy on disk.
- **Inbound**, reads go through `redact_and_truncate`, which scans the complete
  message before slicing. Truncating first cuts a boundary-straddling secret
  into a prefix the scanner no longer matches, and that fragment ships.

A relay also carries **synthetic origin** on both delivery paths — the queue entry
is tagged `SESSION_CONTROL_PAYLOAD`, and a direct start passes
`_synthetic_payload=True`. That is what keeps it off the target's linked
Slack/Telegram thread: the text is a peer agent's, and mirroring it as the target
user's speech would put words in their mouth on a surface other people read.
Riding the user-input path is a property of *delivery*; it is not a claim about
authorship, and the mirror is the one consumer that must not confuse the two.

## The send → wait → read loop

`send` returns as soon as the message lands. It does **not** wait for the
target's reply, because the target's turn can run for minutes and holding a tool
call open for it would burn the caller's own turn budget. Polling is the
supported shape:

1. `session_message_send(target, message)` — note nothing; the send is fire-and-forget.
2. `session_read_message(target)` — record `total`.
3. `wait(seconds=…)`.
4. `session_read_message(target, since=<previous next_since>)` — returns only what
   arrived since, so a loop does not re-read the same messages.

`total` is an **absolute position** in the session, not the length of the live
window. A slot retains only its most recent messages in memory and credits each
trimmed row to a frozen-prefix counter, so a length-derived cursor would freeze
at the retention cap — and a poller on a long session would silently stop seeing
replies, on exactly the sessions that need it most. A `since` older than the
window returns `trimmed: N`: those rows aged out, and a poller that lost them is
told rather than fast-forwarded onto newer rows as if they were the ones asked
for.

`running` is what makes the loop terminable: `running: false` with an empty
window means the target finished and went idle, which is different from "nothing
new yet". `queue_depth` reports how much the target still owes.

The cursor deliberately stops **before the streaming tail**. `chat_runner`
appends a `chunk` row per token burst and `_flush_segment` then deletes that
trailing run, replacing it with one durable assistant message — so chunk rows are
always a suffix, never interleaved. Counting them would inflate `total`, the
flush would shrink the list back under it, and the next `since=next_since` read would
skip the finished reply permanently. A read taken mid-reply therefore reports
`streaming: true`, so an empty window while the target is composing is
distinguishable from an empty window because nothing is happening.

A stale cursor is refused, not clamped. A compacted or rewound transcript shrinks,
so a `since` past the end answers 409 `cursor_unavailable` and the caller falls
back to a tail read. Clamping it to the end would look friendlier and lose data:
the rows below the clamp are what replaced the old tail, a cursor never moves
backwards, so they would be skipped permanently while the response read as
"nothing new". A cursor exactly AT the end is not stale and still returns an empty
window.

## Design decision: sending is restricted to sessions this caller created

`session_message_send` reaches **only** sessions the caller opened with
`session_create`. A session the user started themselves is never a target. This
is the surface's central boundary, so it is worth stating why it is an ownership
check and not a set of safety properties re-verified at delivery.

Delivery is not always immediate. A send to a busy target is queued behind its
running turn, and the user can change the target while it waits -- link it to a
Slack channel, add an outbound mirror, move it to another workspace. Validating
the target's properties therefore means validating them at *every* later moment
delivery can happen (the drain, the turn start, the reply egress) against *every*
property that can move. That is a grid, and each cell missed is a defect: the
first version of this feature checked at send time only, and the follow-ups added
the drain, then the workspace, then the reply mirror -- one cell at a time.

Ownership collapses the grid instead of enumerating it. A session the caller
created carries no conversation the caller was not already responsible for, so
the question stops being "is this target still safe to deliver into" and becomes
"is this target mine" -- and that answer cannot change while a message waits,
because nothing but creation sets it.

**What this costs.** Two sessions the user opened by hand can no longer message
each other. Coordinating tabs was part of the original motivation for this
feature, and that half is gone: an agent now has to create the session it wants
to drive. This is a deliberate trade of reach for a boundary that holds.

**How ownership is recorded.** The created slot's metadata carries
`created_by_tab`, the creating session's **durable tab id** (a per-slot uuid),
deliberately not its slot key:

- It is **not forgeable by renaming**. Auto-generated slot keys carry a counter
  and a timestamp, but a caller may ask for a slot BY NAME and a printable-ASCII
  name is returned unchanged -- so a closed creator's key can be deliberately
  re-minted. Had ownership compared slot keys, that replacement session would
  inherit authority over the original's children. A tab id is minted per slot and
  cannot be claimed by taking a name.
- It is **durable**. `created_by_tab` is in `SLOT_OWNED_META_KEYS` and written on
  every slot save, so a gateway restart neither revokes a grant nor invents one.
  For an owned key an absent field reads as "cleared", which is why registering
  it and writing it are one change, not two.
- It **fails closed on an absent id**. Both sides must be present and equal; an
  empty owner and an empty caller must never compare equal and authorize.
- It is recorded on the **child**, not as a list on the parent. One write at
  birth, one lookup at check time, nothing to keep in sync, and the fact lives
  with the session being protected rather than with the session claiming it.
- It is **never carried across a session transfer**. A tab id names one
  machine's session; imported into another instance it would name a different,
  unrelated session and hand it authority nobody granted.

**Re-checks at the drain.** A queued relay has two delivery moments, so the drain
re-checks the boundaries that can move in between: the channel bindings, and the
target's agent/workspace, compared against values **pinned on the relay when it
was accepted**. Each queued entry is judged on its own pins -- two relays can
straddle an agent switch, and judging the batch by one of them would delete a
message that is still deliverable. A relay promoted to a steer and then requeued
by its turn's teardown loses those pins (the pending-steer list holds bare
strings), so it is refused as unverifiable rather than delivered unchecked.

**What is NOT ownership-gated.** `session_read_message` and `session_stop` still
work on any addressable session. Both are synchronous and neither writes into the
target's conversation, so neither has a window between authorization and effect.
They stay bounded by the caller-side refusals instead -- notably that a
channel-linked or mirrored caller cannot use this surface at all, because what it
reads would land in front of that channel's audience.

**Ownership is the last gate, not the only one.** Every refusal above it still
reports its own reason, so an owned target that is somehow ephemeral,
channel-bound or cross-workspace is refused for that. Ownership narrows *who* may
be addressed; it does not widen *what* may be addressed.


## Configuration

`agent.session_control` (bool, default **true**). Off makes all four tools
refuse with a message naming the switch. Default-on is deliberate: every target
is one of the user's own sessions on their own machine, reached over loopback
with an audited internal secret, and a feature that ships invisible is a feature
nobody finds.

The value is read with `_safe_bool(..., False)`, so a **malformed** value
disables the feature rather than falling back to the field's own (enabled)
default: `bool("false")` is `True`, and a user who wrote the opt-out in an editor
that quotes values would otherwise keep cross-session control on while believing
it off. Absent still means enabled, because the lookup supplies a real `True`.

## What is deliberately not here

- **No cross-workspace or cross-machine reach.** The boundary is one gateway's
  live sessions in one workspace.
- **No waking closed sessions.** See above.
- **No reply-waiting send.** Polling keeps the caller's turn budget intact and
  keeps the two sides independent.
- **No provenance graph.** The chain is bounded by a single `hops` counter
  (`MAX_HOPS`), not by tracking who relayed what to whom. The counter rides in the
  delivered message's `session_control` meta and is read off the caller's newest
  user turn, so a relay chain terminates while a human typing resets it — enough
  to stop an unattended A ↔ B loop without modelling the topology.
