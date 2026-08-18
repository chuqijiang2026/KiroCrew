import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * The hooks table is an AUTO-layout table whose declared column widths exceed a
 * phone (and a rail-narrowed desktop pane), so Actions — the last column —
 * starts past the scroll edge at rest and Test/Edit/Delete cost a horizontal
 * scroll. The fix pins the Actions cells (header + body) `sticky right-0` on an
 * opaque background, with a seam (border + `right-full` fade) gated on the
 * MEASURED overflow flag — same treatment as the Schedule jobs table (#4102),
 * adapted for auto layout where a wrapper-anchored cue cannot know the pinned
 * column's edge.
 *
 * Load-bearing parts a later edit could lose separately:
 * 1. `sticky right-0` + `bg-card` on BOTH cells (transparent cells show the
 *    scrolling columns through the pin).
 * 2. The overflow gate on the seam (a permanent seam lies on a table that fits).
 * 3. The row-state overlay: even rows mirror `.table-striped`'s `--card-hl`
 *    zebra, odd rows mirror the hover tint via the named row group — losing it
 *    makes the pinned cell ignore zebra/hover while the rest of the row paints.
 *
 * Comments are stripped before matching — the rationale in the page quotes the
 * class names being asserted.
 */
const PAGE = join(__dirname, '..', 'pages', 'HooksPage.tsx')

const loadSource = async () => {
  const raw = await readFile(PAGE, 'utf8')
  return raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1')
}

describe('HooksPage table sticky Actions column', () => {
  it('measures the real scroller', async () => {
    const src = await loadSource()
    expect(src).toMatch(/<div ref=\{attachHooksScroller\} className="overflow-x-auto">/)
  })

  it('pins the Actions header cell with an overflow-gated seam', async () => {
    const src = await loadSource()
    const header = src.match(/<th className=\{`([^`]*)`\}>\s*\{hooksTableEdges\.right &&/)
    expect(header, 'the Actions <th> moved or changed shape').toBeTruthy()
    const cls = header![1]
    expect(cls).toContain('sticky')
    expect(cls).toContain('right-0')
    expect(cls).toContain('bg-card')
    expect(cls, 'the border seam must stay overflow-gated').toContain("hooksTableEdges.right ? 'border-l' : ''")
  })

  it('pins the Actions body cell with the row-state overlay and gated seam', async () => {
    const src = await loadSource()
    const cell = src.match(/<td aria-label=\{i18nT\('pages\.hooksPage\.actions'\)\} className=\{`([^`]*)`\}>/)
    expect(cell, 'the Actions <td> moved or changed shape').toBeTruthy()
    const cls = cell![1]
    expect(cls).toContain('sticky')
    expect(cls).toContain('right-0')
    expect(cls).toContain('bg-card')
    expect(cls, 'the border seam must stay overflow-gated').toContain("hooksTableEdges.right ? 'border-l' : ''")
    // The row names the group the overlay listens to…
    expect(src).toMatch(/<tr key=\{h\.id\} className=\{`group\/hookrow /)
    // …and the overlay mirrors zebra on even rows, hover on odd rows.
    const overlay = src.match(/<div aria-hidden className=\{`absolute inset-0 -z-10 ([^`]*)`\} \/>/)
    expect(overlay, 'the row-state overlay is gone from the Actions cell').toBeTruthy()
    expect(overlay![1]).toContain("i % 2 === 1 ? 'bg-[var(--card-hl)]' : 'group-hover/hookrow:bg-bg-hover'")
  })

  it('fades clipped content into the pinned cells only while columns are hidden', async () => {
    const src = await loadSource()
    const cues = src.match(/\{hooksTableEdges\.right && <div aria-hidden="true" className="([^"]*)" \/>\}/g) ?? []
    expect(cues.length, 'header and body each carry the gated fade cue').toBe(2)
    for (const cue of cues) {
      expect(cue).toContain('pointer-events-none')
      expect(cue, 'right-full hangs the fade just left of the pinned cell, auto-layout safe').toContain('right-full')
      expect(cue).toContain('from-card')
    }
  })
})
