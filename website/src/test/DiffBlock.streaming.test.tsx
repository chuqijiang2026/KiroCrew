import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import DiffBlock from '../components/DiffBlock'

beforeEach(() => {
  globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true })) as unknown as typeof fetch
})

const fullPatch = `--- /home/user/example/src/greet.py
+++ /home/user/example/src/greet.py
@@ -1,5 +1,7 @@
 def greet(name):
-    print("Hello " + name)
+    if not name:
+        raise ValueError("name is required")
+    print(f"Hello {name}")
 
 
-greet("world")
+greet("Krish")
`

/** Every streaming prefix of a chat diff block must render without throwing.
 *  Pierre's PatchDiff itself asserts exactly-one-file-diff and THROWS on the
 *  partial frames a streaming fence produces (bare header lines, no hunk yet)
 *  — the wrapper must absorb those states rather than crash-looping the
 *  per-message error boundary. */
describe('DiffBlock streaming', () => {
  it('renders every streamed prefix without throwing', () => {
    for (let end = 1; end <= fullPatch.length; end += 7) {
      const partial = fullPatch.slice(0, end)
      const { unmount } = render(
        <DiffBlock code={partial} complete={false} streaming />,
      )
      unmount()
    }
  })

  it('renders a multi-file patch without throwing', () => {
    const multi = fullPatch + '\n' + fullPatch.replace(/greet\.py/g, 'other.py')
    expect(() => render(<DiffBlock code={multi} complete />)).not.toThrow()
  })

  it('renders empty and header-only content without throwing', () => {
    expect(() => render(<DiffBlock code="" complete={false} />)).not.toThrow()
    expect(() =>
      render(<DiffBlock code={'--- /a/b.py\n+++ /a/b.py'} complete={false} />),
    ).not.toThrow()
  })
})
