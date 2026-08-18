# Changelog

All notable changes to KiroCrew are documented in this file.

## [0.3.0] — 2026-08-17

The agent gained its own browser and can now run several threads of your work at
once. Sessions explain themselves when you come back to them, Linux ARM64 and
Windows join the first-class builds, and you can talk to it by holding a key.

### Run several threads at once

- **Crew Mode** — Send the next message without waiting for the last one. Topics
  are dispatched to parallel sub-sessions and answers arrive independently, so
  one chat advances several pieces of work at the same time.
- **Session summaries** — A side-panel tab says what each thread of a session was
  trying to do and where it landed, with anything still open hoisted to the top.
  Old sessions can be summarised on demand. Opt-in, with its token cost stated.
- **Sessions resume instantly** — An earlier chat loads in the background while
  you read it, so the first message sends immediately instead of waiting on a
  cold start.
- **You can watch the context fill up** — The composer reports consumption as a
  percentage and a token count, so compaction stops arriving as a surprise.
- **A wedged turn recovers itself** — A stuck tool, a dead process, or a frozen
  model call is detected and nudged back to life instead of hanging silently.
- **Pinned messages, and a session that admits it needs you** — Pin messages for
  reference; a session waiting on your answer says so instead of looking idle.

### The agent gets its own browser

- **The Browser panel is the browser** — The agent drives the dashboard's own
  side panel directly: navigate, click, type, screenshot. Browsing happens where
  you are already looking, with no second window and no security prompt. The
  Playwright CLI remains for remote sessions and for a browser you are already
  logged into.
- **Nothing to install first** — Browsing no longer needs Node or npm on the
  machine. A private, verified copy is fetched for you, so a locked-down laptop
  is one click from a working browser rather than a dead end.
- **Computer Use is offered only where it works** — Native desktop automation
  appears on macOS, instead of everywhere and then failing.

### Two new apps, and a store worth browsing

- **Personal Shopper** — Researches real stores on your behalf and recommends
  something only when buying actually helps. It diagnoses the problem first, and
  never touches a cart.
- **Issue Radar Crews** — Put autonomous workers on claimed issues. Each crew
  takes an issue into its own worktree, posts progress to a public claim ledger,
  and pushes a pull request: hands-free from triage to code review.
- **A curated App Store** — Discover renders editorial spotlights, themed
  collections, and category rails with curator artwork, not one flat list.
- **Meetings keeps the transcript** — Stored and shown beside the agent's notes,
  and it survives a reload.
- **Ask Code Review Sage why** — The reviewer stays available after it posts, so
  you can question a finding instead of starting over.
- **Research Lab and Spec Builder pick their own model** — Instead of always
  falling through to your chat default.
- **A public deploy asks first** — Publishing an artifact publicly requires an
  explicit acknowledgement, and an operator can close the path entirely.

### Reach it from anywhere

- **Linux ARM64** — A native aarch64 desktop build, published with an
  architecture check so nobody downloads the wrong one.
- **Windows is a first-class build** — The same targets as macOS and Linux, with
  its own install guide.
- **Summon it from any app** — A system-wide hotkey (Cmd+Shift+K on macOS,
  Alt+Shift+K elsewhere) raises the dashboard. Reconfigurable, or off.
- **Change release channel without reinstalling** — Move between Stable, Insider,
  and Nightly from About, and the gateway restarts in place after an update.
- **Publish it on your tailnet** — `kirocrew tailnet up` puts the dashboard on
  your Tailscale network, reachable from your other devices.
- **Launch a cloud crew from the dashboard** — Remote EC2 provisioning, device
  sign-in included, as a restartable job rather than a CLI session you must not
  close.
- **Keep on Top** — Pin the window above everything else, remembered across
  restarts.

### Voice, terminal, and files

- **Push to talk** — Hold a key to dictate, or tap to latch it on. The key, the
  mode, and a live test strip are in Settings.
- **The terminal docks where you want it** — Bottom or right, opening in the
  session's own project directory, with your preferred shell.
- **Images are kept as artifacts** — Screenshots and diagrams the agent produces
  are preserved with a gallery, a detail page, and metadata.
- **Reveal a file on disk** — Jump from the file viewer to its folder in Finder
  or Explorer.

### Channels

- **Discord and Telegram threads stay alive** — A reply sent from the dashboard
  is relayed back into the conversation it came from.
- **Telegram has a real command menu** — Type `/` for autocomplete, switch models
  with inline buttons, and toggle auto-approve without leaving the chat.
- **WeChat accepts attachments** — Photos, voice memos, and documents reach the
  agent instead of being dropped.
- **A channel can file its own sessions** — Point a channel at a named sidebar
  folder and its conversations group themselves there.

### Tools and connections

- **Connecting takes one click** — Connect mints the provider's approval link
  immediately and consent finishes on the card, instead of waiting for a later
  chat to trigger the challenge.
- **Pooling works itself out** — Kiro Crew probes which MCP servers can safely
  share a process. A per-server choice replaces the old global switch and its
  guesswork.
- **Per-agent tool sets** — Assign servers to particular agents so each sees its
  own surface without editing global config.
- **Tune how tools defer** — Decide how aggressively Tool Search hides tools
  until they are needed, trading context for immediacy.

### Autonomy with a governor

- **It knows when the machine is full** — Scheduled jobs defer and new subagents
  are refused when memory is critically low, and the header shows the posture so
  you know before heavy work fails.
- **Each job sets its own time budget** — Up to 24 hours, replacing one fixed
  thirty-minute cap for every job.
- **Read a script job without a terminal** — Its Python source is shown,
  highlighted and read-only, in the job's detail view.
- **Monitoring keeps its schedule** — Talking to a session mid-loop no longer
  restarts the countdown, so checks land when they were meant to.
- **A blip is not a failure** — Transient throttles and server errors retry
  instead of counting toward the auto-pause threshold.

### Memory and knowledge

- **Lessons surface by relevance** — Applicable older corrections stop decaying
  out of context as the library grows.
- **Knowledge spending is bounded, and opt-in** — A sweep budget, per-source rate
  limits and caps, a configurable extraction model, and visible per-source cost.
  A fresh install ingests nothing until you say so.

### Security and governance

- **An app sees only its own events** — Installed apps receive the event scopes
  their manifest declares, and can no longer observe your chats, your scheduled
  job results, or another app's activity.
- **Scheduled jobs are re-vetted every run** — Checked against current policy
  each time they fire rather than only when created, and a restored backup can no
  longer smuggle shell commands past the approval system.
- **The memory ceiling covers everything at once** — The cap applies to all
  concurrent agents together, so many small spawns can no longer exhaust the host
  between them.
- **Credentials are scrubbed on the live stream** — Redaction now covers
  real-time output as well as replayed history.
- **A pinned policy floor cannot be lowered locally** — On a governed host the
  policy wins over local configuration.
- **Bring your own identity provider** — Administrators can authorise their own
  OAuth providers by configuration, without waiting for a release.

### Everywhere else

- **It fits on a phone** — Every major panel collapses to a usable single pane,
  and the software keyboard no longer covers the composer.
- **Search your history in Chinese, Japanese, and Korean** — Text without spaces
  between words is now searchable.
- **Storage you can actually clear** — The session storage screen loads in
  seconds and deletes in bulk.

### Notable fixes

For anyone who wants to know whether their particular annoyance is gone.

- Dropping a folder into chat inserts its path instead of trying to upload it.
- Screenshots downscale on the longest edge, so a tall page capture no longer
  breaks the conversation it was taken in.
- Browser setup copes with non-apt Linux, and with a Node the service's own PATH
  does not carry.
- Session start has its own timeout budget, so a slow MCP fleet no longer looks
  like a hung agent.
- A resumed session keeps its pooled MCP servers instead of quietly falling back
  to unpooled ones.
- Stopping a turn stops the session the turn is actually running on.
- A stalled subagent card says how long it has been idle.
- A long session title no longer pushes the header controls off the screen.
- Korean joins the speech-to-text language picker, and the settings shown match
  the provider you selected.
- Telegram ignores a slash command aimed at a different bot in the same group.
- Teams retries a rate-limited message instead of dropping it.
- Discord keeps a code fence open and preserves indentation when a long reply
  rotates across several messages.
- Lessons keep their "not this" clause as a field of its own, and an imported
  lesson renders as its rule rather than as raw data.
- Memory refuses to store an empty value, and a dimension mismatch no longer
  breaks similarity search.
- The Knowledge page lists the files it failed on, and accepts Org Mode.
- A scheduled job counts a delivery failure toward auto-pause, so a job that
  never actually reaches you stops claiming success.
- Phone-width layout fixes reach Dev Fleet, Issue Radar, the artifact panels, and
  the app file tree.
- The gateway stops reporting another product's memory usage as its own.
- The Security panel is translated instead of falling back to English.

## [0.2.0] — 2026-08-09

The first feature release after launch: a real browser for the agent, four new
built-in apps, a native Windows desktop build, Korean and Japanese interfaces,
setup that no longer assumes Slack, and several hundred fixes from the first
weeks in the open.

### The agent gets a browser

- **Persistent Browser Mode** — Flip one switch in Settings and the agent can
  operate a real browser: navigate, click, type, and fill forms, with the live
  view streaming into the dashboard's Browser panel. Installation happens for
  you and recovers on its own — enabling it never errors out — and the agent can
  also serve browser work from the native embedded view.

### Eight new built-in apps

- **Spec Builder** — a spec-driven development surface: shape requirements into
  a spec, then hand it to the agent to implement.
- **Ops Mission Control** — an autonomous ops first responder with an incident
  board and a knowledge ledger of fix patterns.
- **Crew Companion** — a desk companion that reflects what your agent is doing.
- **Auto-Improvement** — measurement-first self-improvement that proposes,
  lands, and verifies its own changes GitHub-natively.
- **Meetings** — transcribes a live meeting, keeps structured notes and diagrams
  as it goes, and extracts action items you can review afterwards. Recordings
  and notes can now be deleted from the app.
- **Papyrus** — a LaTeX paper editor with a split-pane view, live PDF preview,
  and an AI co-author.
- **Mochi** — a desktop companion that lives on your screen in its own panel,
  watches pages and feeds for you, and plans its day around your schedule.
- **PPTX Maker** — describe the deck you want in chat and get a real `.pptx`
  back, by way of an agent that interviews you and writes a brief, an outline,
  and an art direction first.
- Every one of these is **opt-in**: install it from the App Store and enable it
  before it does anything.
- Installed apps are searchable and launchable from the command palette, and
  third-party apps now run under **per-app trust grants**, with a denial that
  tells you exactly what to do about it.
- **MCP Apps has its own switch** instead of riding the connection-pooling
  toggle, and the shared MCP gateway follows it.
- **Connections** gained a provider registry, so an integration declares what it
  is asking for and its consent URL is validated before you are sent to it.
- Pasting an OAuth return address for an approval that has already expired now
  says so, instead of blaming the paste — a spent approval is told apart from a
  failed delivery, so you know to start a fresh one rather than re-copy a dead
  address.
- Clicking **Connect** now asks for the provider's approval link instead of
  waiting for one, so the card offers it within seconds rather than only after
  some later chat happens to reach that server.
- Code Review Sage works against **GitHub Enterprise Server** hosts.
- An MCP server that authenticates with OAuth now receives the scope list and
  client id in the fields kiro-cli actually reads, so those connections
  authorize instead of silently failing.

### Windows, properly

- The desktop build moved to an **NSIS installer** with an integrated titlebar,
  launcher spawn/stop fixes, and a configurable sandbox tier for agent
  subprocesses. Skills, the usage ledger, and build tooling all learned the
  platform's rules.

### A dashboard you can operate

- **System is now a task manager** — live per-session resource usage, plus a
  **Storage** screen that reports what sessions cost on disk and reclaims space
  to a trash, with an inventory that no longer calls idle sessions "in use".
- **Releases tab** — this changelog, rendered per version in Settings.
- **Webhooks** — named tokens, HMAC signing, and a kill switch for inbound
  automation. The page is still being finished, so it now sits behind a
  per-device **Preview pages** toggle under Developer and is hidden by default.
- Redesigned sidebar folders, drag a session into an open chat to reference it,
  suggested folders for new sessions, consistent empty states with a next step,
  and a notification sound when an approval prompt needs you.
- **Continue instead of retyping** — resume an interrupted turn from where it
  stopped, on any idle session, and recover cleanly from tool-hook blocks and
  failed restores. Queued messages can be reordered before they send.
- The terminal panel pops out into its own window, completes subcommands and
  flags (not just paths), and takes a configurable font.
- **Agent Templates became a two-pane inspector**, and agents defined in the
  project you are working in are discovered alongside your user-level ones.
- **Send a copy of a session to another instance** — hand a conversation, with
  its context, to a different Kiro Crew you run.
- Jira issue URLs and setting references render as **link chips** you can click
  straight through.
- Stale auto-titles refresh in the background, the command palette tells a
  failed scoped search apart from an empty one, sidebar search keeps its
  relevance order, and the chat action footer grows to 40px targets on touch
  devices.
- Bold, italic, and strikethrough now render correctly in **CJK prose**.
- While the agent is waiting on something, the wait shows a **live countdown**
  with a button to end it early instead of leaving you guessing.

### Channels, and setup that no longer assumes Slack

- **`kirocrew setup` stops asking for Slack tokens.** The wizard finishes on the
  dashboard and points at the full set of chat channels; walk through the Slack
  credentials only when you ask for them with `kirocrew setup --slack`. Docs and
  in-app copy describe Kiro Crew as multi-channel rather than Slack-first.
- **Telegram** accepts inbound attachments — images for vision, documents, and
  audio that is transcribed on arrival. Serving **multiple bot accounts per
  gateway** was withdrawn before this release: a second bot is a second inbound
  door, and it is only worth having once a bot can be turned off, given its own
  security posture, and named honestly in the audit log on its own. A
  `telegram.accounts` entry written by an earlier release candidate is preserved
  in config but no longer starts a bot — move the token you want served to
  `telegram.bot_token`.
- A sub-agent's completion now reports back into **non-Slack** parent sessions,
  Discord continues the connected session when a reply arrives, and Slack
  renders an `OPTIONS` prompt as a real control everywhere it appears.

### Voice, language, and models

- **Korean and Japanese** join the dashboard — twelve interface languages.
- **On-device Apple speech-to-text** with live streaming; switch the microphone
  mid-recording; dictation lands at the cursor.
- The model picker shows each model's **credit multiplier** and scopes itself to
  what the account can actually use; background and sub-agent work take a
  **configurable per-role model** and reasoning effort.

### Autonomy with a governor

- Sub-agents can be steered with queued follow-ups, scoped to exactly the
  context a task needs, and report completions as cards in the chat.
- Monitoring loops accept a **wall-clock runtime budget**; cron jobs group into
  collapsible folders and start from a **template gallery** of 15 presets.
- Skills show their **per-injection context cost** on a budget screen, can opt
  out of injection, and the knowledge library adds documents automatically,
  dedupes per document, and honors `.kiroignore`.

### Diagnostics and trust

- **Report a Problem** collects a support bundle from the CLI or the UI, and
  every error message carries an "Ask the agent" hand-off.
- Loopback requests no longer leak the internal secret to a proxy; sensitive
  paths and credential redaction got faster without getting looser.
- The ACP runtime survives oversize output frames, worker sessions are no longer
  reaped as orphans, and `kirocrew update` works for wheel and `cli.sh` installs.
- A refusal from one of **your own** deny patterns can carry your note
  explaining it, and the seven always-on git-publish rules now render locked in
  Settings instead of offering a toggle that never took effect.
- The gateway **refuses to boot when its data home cannot persist state**,
  rather than running and losing your work silently.
- The tool-approval window and the watchdog's stall windows are both bounded by
  the turn ceiling, so neither outlives the turn it belongs to.

Plus roughly 280 further fixes across the dashboard, chat, the chat channels,
ACP transport, history consolidation, packaging, and CI.

## [0.1.3] — 2026-08-07

A hot patch for model entitlement: the model picker scopes itself to what the
account can use, a model the account cannot use is never sent, and an
unavailable model is reported as an access problem instead of a capacity error
or a raw JSON-RPC dump.

## [0.1.2] — 2026-07-30

First public release of KiroCrew — an open-source personal AI agent that runs on
your own machine, driving [kiro-cli](https://kiro.dev) over the Agent Client
Protocol. Install it, sign in once, and it is yours: no server to rent, no
account to create, and your conversations, memory, and files stay on your disk.

### Chat from wherever you already are

- **One agent, ten ways in** — A web dashboard, a native desktop app, a terminal
  CLI (`kirocrew chat`, plus a full TUI), and bots for **Slack, Discord,
  Telegram, Microsoft Teams, Webex, WeCom (企业微信), and WeChat** all drive the
  same gateway with the same memory and the same tools. Start
  something at your desk, follow up from your phone. Each Slack thread or
  Discord DM is its own isolated session, and a dashboard session can be handed
  off to a Slack thread and stay in sync both ways.
- **A dashboard built for long sessions** — Multiple concurrent chats with
  auto-generated titles, live streaming tool status, and a context-usage ring.
  Edit and resend an earlier message, rewind a conversation to any point, fork a
  session into a new tab with its full context, or regenerate a reply and browse
  the variants. Organize with project folders, tags, Trello-style columns, and
  per-session colors; search across every session by content. 18 color themes,
  a Monaco code editor, `@filename` fuzzy file attach, and an incognito mode
  whose sessions never write to memory.
- **Speak and be spoken to** — Live streaming speech-to-text over WebSocket,
  voice memos transcribed on arrival, and local Piper text-to-speech for replies
  with no cloud round-trip.
- **Ten languages** — The interface ships in English, German, Spanish, French,
  Italian, Portuguese, Russian, Hindi, Bengali, and Chinese.

### Work that continues while you are away

- **Unattended multi-step tasks** — Hand it a spec and it decomposes, executes,
  tests, and retries (`kirocrew run TASK.md`), designed for 10+ hour runs. It
  checkpoints to disk, so a crash or Ctrl+C resumes where it stopped; if
  kiro-cli dies it rebuilds the session and carries on; a watchdog catches
  stalls; and an LLM reviewer checks the result against the spec before calling
  it done. Failed steps become lessons it keeps.
- **Autopilot** — A per-session toggle that turns ordinary chat into
  plan-then-execute, with visible, editable plans, for when a request is bigger
  than one turn.
- **Cron scheduling** — Recurring jobs with per-job timezones, skip-dates for
  holidays, per-job timeouts, and jitter to spread load. Each job chooses
  whether it remembers the previous run. A job that finds a broken build at 3am
  can fix it and tell you over breakfast.
- **Parallel subagents** — Split one job across background agents
  (`kirocrew spawn run`), blocking or fire-and-forget, with progress visible in
  the chat header and completions delivered back into the conversation.
- **Dynamic workflows** — For work too structured for one agent, an authored
  Python script drives many agents through fan-out, pipelines, and
  judge-and-verify stages. An agent will usually write the script for you from a
  plain-English goal.
- **Proactive push** — The agent can pause mid-session to poll something, or
  register a webhook so an external system (CI, an alert, an inbox) wakes it up
  later.

### It remembers, and it learns

- **Memory that survives restarts** — Preferences, project context, and daily
  conversation history persist and are searched both by keyword and by meaning.
  Embeddings run **locally and in-process**, so nothing leaves your machine to
  make memory work. A graph explorer shows how memories relate.
- **Corrections stick** — Correct the agent once and it is kept as a lesson
  injected into every future session, so the same mistake does not return next
  week.
- **Knowledge Library** — Ingest your own documents and code into a searchable
  personal knowledge graph the agent can consult.
- **Snapshot and restore** — One command backs up config, memory, lessons,
  crons, skills, and history; restore all of it or just selected components,
  with a dry-run preview.

### Extend it

- **Apps, with six built in** — An App Store in the dashboard, an `app.json`
  manifest, TypeScript and Python SDKs, and gateway lifecycle hooks. Shipping in
  the box: **Auto Research** (multi-cycle research campaigns that keep going
  after you walk away), **Code Review Sage** (reviews each changed file of a PR
  in its own agent session), **Issue Radar** (GitHub/GitLab triage that
  remembers its notes), **Workflows**, **File Explorer**, and **Dev Fleet**.
- **Skills** — Plain markdown files that teach the agent a workflow, loaded
  automatically when a message matches or on demand when it decides it needs
  one. Twelve ship built in; write your own with no code and no rebuild.
- **Any MCP server** — Discover, probe, enable, and disable MCP servers from the
  dashboard. KiroCrew's own capabilities are exposed the same way, so the agent
  calls structured tools instead of shelling out.
- **Artifacts** — Documents, code files, and interactive widgets with a stable
  identity, version history, and a dashboard library. Deploy a webapp artifact
  to **your own** AWS account and get a public HTTPS link with a TTL.

### Drive your desktop, not just a browser tab

- **Computer use** — The agent can read a native application through the
  accessibility layer and operate it: take a window as a numbered outline of its
  buttons, fields, and rows, then press, type, set a value, scroll, or drag.
  This reaches work with no web UI — pulling a figure out of a spreadsheet,
  walking a desktop-only internal tool, reading an error dialog and telling you
  what it says. **Your mouse pointer never moves by accident**: actions are
  delivered to the target app, so a background window works without stealing
  your cursor or focus, and the one path that does take your real pointer has to
  be named explicitly by the model — the automatic choice never resolves onto it.
  **Off by default and macOS-only in this release**; enable it in Settings →
  Computer Use. Password fields are never read and a window holding one is never
  photographed, destructive-command-shaped text is refused rather than typed, and
  every call — allowed or refused — is written to the audit log.
- **Browser automation** — Playwright-driven navigation, form filling, and
  screenshots, including the ability to look at its own front-end changes and
  judge them.

### Security you can reason about

- **An OS sandbox you can switch on** — kiro-cli subprocesses can be confined by
  Linux namespaces or macOS Seatbelt, with three modes controlling which
  credential directories are even visible. This ships **opt-in**: the default
  (`agent.sandbox: "off"`) defers to whatever sandboxing kiro-cli applies itself,
  so set `agent.sandbox` to `"auto"` to have KiroCrew wrap the subprocess.
- **Layered controls** — 137 built-in denied-command patterns that hold even in
  YOLO mode, credential redaction scanning everything the model emits, blocked
  access to `~/.aws` and `~/.ssh`, XSS sanitization with CSP, and an audit log of
  every command.
- **A ceiling the agent cannot raise** — A two-level governance model
  (`POLICY ∩ PROFILE`, tightest-wins) enforced at KiroCrew's own tool gate. The
  policy files live where the agent can neither read nor write them, so a
  prompt-injected agent cannot widen its own limits. Tool calls are auto-approved
  by default (`agent.approval_mode: "auto"`) with the deny and governance gates
  still applied first — set it to `"interactive"` to be asked before each call.
  The dashboard is loopback-only and the Slack bot is locked to its owner.

### Run it your way

- **Install however suits you** — A signed and notarized universal macOS DMG, a
  Linux AppImage, a multi-arch Docker image for always-on servers, and a
  `pip`-installable wheel. The desktop app bundles its own Python, so end users
  need no toolchain. Runs on **macOS, Linux, and Windows**.
- **Three release channels** — **stable** is the default; **insider** gets
  release candidates a week or two early and is a switch away in Settings, since
  the two share one app and just follow different update lanes; **nightly**
  tracks the latest code and installs alongside your production app rather than
  replacing it, so you can run both. The desktop app updates itself, and nothing
  downloads or installs without you asking.
- **Always on** — Install as a systemd or launchd service, and manage several
  remote instances (dev boxes, EC2, a home server) from one hub over SSH.

### For app developers

- **`ctx.cron` mutators stay synchronous, with `*_async` siblings.** The App Kit
  surface (`add_job` / `remove_job` / `update_job` / `remove_all`) is
  synchronous, as published. Called from a genuinely loop-less context (CLI, MCP
  process, worker thread — what apps overwhelmingly use) they run inline as
  before. Called from a **running event loop** — an on-loop `on_startup` hook or
  route handler — they now raise `CronSyncOnLoopError` instead of parking the
  gateway loop for the cron-store lock window and stalling chat, timers, and
  heartbeats for every session. Migration is one line:
  `ctx.cron.add_job(...)` → `await ctx.cron.add_job_async(...)`, identical
  arguments and return value. The error is raised before any mutation, so a
  refused call never half-applies.

### Notes

- **kiro-cli is required** — KiroCrew orchestrates it. `kirocrew setup` walks you
  through installing and signing in; `kirocrew doctor` verifies the whole wiring.
- **Data lives in `~/.kiro/crew`** — override with `KIROCREW_HOME`. Installs
  using the earlier `~/.kirocrew` layout migrate automatically on first launch.
- **The dashboard defaults to `http://localhost:5476`** — override with
  `KIROCREW_PORT`.
- **Optional extras** — speech-to-text needs `pip install kirocrew[voice]`; the
  OS sandbox is POSIX-only; computer use is macOS-only in this release.
