import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ToolInputText } from '../components/ToolInputText'

/* Diff-shaped input is handed to Pierre, which paints its rows inside a shadow
 * root behind a lazy chunk — so the per-line tints, the hunk chrome and the
 * stripped `---`/`+++` headers are not assertable here; that appearance is
 * Playwright's job. What this suite still owns is the routing decision: which
 * inputs take the diff path versus JSON highlighting versus plain text. */
describe('ToolInputText', () => {
  it('renders plain text when no diff markers present', () => {
    const { container } = render(<ToolInputText text="just some text" />)
    expect(container.textContent).toBe('just some text')
    expect(container.querySelectorAll('.bg-diff-add')).toHaveLength(0)
  })

  it('highlights JSON keys and values', () => {
    const text = '{"name": "test", "count": 42, "active": true}'
    const { container } = render(<ToolInputText text={text} />)
    const spans = container.querySelectorAll('span')
    expect(spans.length).toBeGreaterThan(1)
  })

  it('falls through to plain text when JSON regex finds no matches', () => {
    const text = '{not valid json'
    const { container } = render(<ToolInputText text={text} />)
    expect(container.textContent).toBe(text)
  })

  it('highlights truncated JSON with valid regex matches', () => {
    const text = '{"key": "val"'
    const { container } = render(<ToolInputText text={text} />)
    const spans = container.querySelectorAll('span')
    expect(spans.length).toBeGreaterThan(1)
  })

  it('skips JSON highlighting for very large text', () => {
    const text = '{"key": "' + 'x'.repeat(60000) + '"}'
    const { container } = render(<ToolInputText text={text} />)
    expect(container.textContent).toBe(text)
  })

  it('formatted mode (default) unescapes \\n inside JSON string values', () => {
    const { container } = render(<ToolInputText text={'{"command": "a\\nb"}'} />)
    expect(container.textContent).toContain('a\nb') // real newline
    expect(container.textContent).not.toContain('a\\nb') // no literal backslash-n
  })

  it('raw mode preserves \\n escapes verbatim', () => {
    const { container } = render(<ToolInputText text={'{"command": "a\\nb"}'} raw />)
    expect(container.textContent).toContain('a\\nb') // literal backslash-n kept
    expect(container.textContent).not.toContain('a\nb') // not turned into a newline
  })

  it('formatted mode preserves a genuine literal backslash-n (JSON \\\\n)', () => {
    // JSON "\\n" encodes a literal backslash + n, which must NOT become a newline.
    const { container } = render(<ToolInputText text={'{"command": "a\\\\nb"}'} />)
    expect(container.textContent).toContain('a\\nb') // still backslash-n
    expect(container.textContent).not.toContain('a\nb') // not a real newline
  })
})
