/**
 * Repo-wide guard for the crash that closed the app when a stock was tapped.
 *
 *   FATAL EXCEPTION: mqt_v_native
 *   JavascriptException: Error: Rendered more hooks than during the previous render.
 *     at StockTradeModal
 *
 * The cause was a Rules-of-Hooks violation, not bad market data: a component
 * returned early (`if (!visible) return null`) *above* some of its hooks, so the
 * hidden render ran fewer hooks than the visible one. React treats a changed
 * hook count as unrecoverable, and in a release build React Native forwards it
 * to the native exception handler, which kills the process.
 *
 * Five components had this shape (StockTradeModal, FundInvestModal,
 * AddStockModal, CompoundCalculatorModal, RoleSelectorModal). This test fails if
 * any component reintroduces it, because the symptom — a hard process death
 * with no JS stack in the UI — is expensive to diagnose from scratch.
 */
import * as fs from 'fs';
import * as path from 'path';

const SRC = path.join(__dirname, '..', 'src');
const HOOK_CALL = /\b(use[A-Z]\w*)\s*\(/;

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(full));
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

/** Strips comments and string bodies so their braces cannot skew brace depth. */
function stripNoise(line: string): string {
  return line
    .replace(/\/\/.*$/, '')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``');
}

interface Violation {
  file: string;
  line: number;
  hook: string;
  returnedAt: number;
  component: string;
}

/** Opens a control-flow block (not a function literal) — `if (…) {`, `else {`, … */
const OPENS_BRANCH = /^(\}?\s*else\b|if\s*\(|switch\s*\(|for\s*\(|while\s*\()/;

/** An early exit, including the single-line `if (!visible) return null;` form. */
const EARLY_RETURN = /^(if\s*\(.*\)\s*)?return\b/;

/**
 * Flags any hook called at a component's top level *after* that component has
 * already returned on some path.
 *
 * Two shapes count as an early return: one at the component's own body level,
 * and one inside a control-flow block opened at body level (`if (!visible) {
 * return null; }`). A `return` inside a nested *callback* is not an early exit
 * for the component, so branch tracking stops at function literals — otherwise
 * an ordinary `list.map(x => { return x; })` before a hook would be flagged.
 */
function findViolations(file: string): Violation[] {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const found: Violation[] = [];
  const stack: {
    name: string;
    depth: number;
    returnedAt: number | null;
    branchDepth: number | null;
    /** True until the body's opening brace has been counted. */
    pending: boolean;
  }[] = [];
  let depth = 0;

  lines.forEach((raw, index) => {
    const line = stripNoise(raw);
    const trimmed = line.trim();

    // A component declaration: `const Foo: React.FC = (` / `function Foo(`.
    if (/^(export\s+)?(const|function)\s+[A-Z]\w*/.test(trimmed) && /[=(]/.test(trimmed)) {
      stack.push({
        name: trimmed.slice(0, 60),
        depth,
        returnedAt: null,
        branchDepth: null,
        pending: true,
      });
    }

    const current = stack[stack.length - 1];
    if (current && !current.pending) {
      const bodyLevel = current.depth + 1;
      const atBodyLevel = depth === bodyLevel;

      // Track a control-flow block opened directly in the component body.
      if (atBodyLevel && OPENS_BRANCH.test(trimmed) && /\{\s*$/.test(trimmed) && !/=>/.test(trimmed)) {
        current.branchDepth = bodyLevel + 1;
      } else if (depth <= bodyLevel && current.branchDepth !== null && !atBodyLevel) {
        current.branchDepth = null;
      }

      const inBodyBranch = current.branchDepth !== null && depth === current.branchDepth;
      if ((atBodyLevel || inBodyBranch) && EARLY_RETURN.test(trimmed) && current.returnedAt === null) {
        current.returnedAt = index + 1;
      }

      const match = trimmed.match(HOOK_CALL);
      if (match && atBodyLevel && current.returnedAt !== null) {
        found.push({
          file: path.relative(SRC, file),
          line: index + 1,
          hook: match[1],
          returnedAt: current.returnedAt,
          component: current.name,
        });
      }
    }

    for (const ch of line) {
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        // A pending component has not opened its body yet; the braces being
        // closed here belong to its own destructured parameters.
        while (
          stack.length &&
          !stack[stack.length - 1].pending &&
          depth <= stack[stack.length - 1].depth
        ) {
          stack.pop();
        }
      }
    }

    // The body opens on the line that ends with `{`, however long the signature.
    const top = stack[stack.length - 1];
    if (top && top.pending && /\{\s*$/.test(trimmed)) {
      top.depth = depth - 1;
      top.pending = false;
    }
  });

  return found;
}

describe('rules of hooks', () => {
  const files = sourceFiles(SRC);

  it('finds source files to scan', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it('no component calls a hook after an early return', () => {
    const violations = files.flatMap(findViolations);
    const report = violations
      .map(
        (v) =>
          `${v.file}:${v.line} calls ${v.hook}() after an early return on line ${v.returnedAt} (in ${v.component})`
      )
      .join('\n');
    expect(report).toBe('');
  });

  /** Guards the detector itself, so a silent "no violations" cannot be trusted blindly. */
  const scanSnippet = (lines: string[]): string[] => {
    const tmp = path.join(__dirname, `__hookfixture_${Math.random().toString(36).slice(2)}__.tsx`);
    fs.writeFileSync(tmp, lines.join('\n'));
    try {
      return findViolations(tmp).map((h) => h.hook);
    } finally {
      fs.unlinkSync(tmp);
    }
  };

  it('detects the original StockTradeModal shape (single-line guard)', () => {
    expect(
      scanSnippet([
        'export const Broken: React.FC = ({ visible }) => {',
        '  const [a, setA] = useState(1);',
        '  if (!visible) return null;',
        '  const b = useMemo(() => a, [a]);',
        '  return null;',
        '};',
      ])
    ).toContain('useMemo');
  });

  it('detects a guard written as a block', () => {
    expect(
      scanSnippet([
        'export const Broken2: React.FC = ({ visible }) => {',
        '  if (!visible) {',
        '    return null;',
        '  }',
        '  const b = useMemo(() => 1, []);',
        '  return null;',
        '};',
      ])
    ).toContain('useMemo');
  });

  it('does not flag a return inside a callback', () => {
    expect(
      scanSnippet([
        'export const Fine: React.FC = ({ list }) => {',
        '  const doubled = list.map((x) => {',
        '    return x * 2;',
        '  });',
        '  const b = useMemo(() => doubled, [doubled]);',
        '  return null;',
        '};',
      ])
    ).toEqual([]);
  });

  it('does not flag hooks that all precede the guard', () => {
    expect(
      scanSnippet([
        'export const Good: React.FC = ({ visible }) => {',
        '  const [a] = useState(1);',
        '  const b = useMemo(() => a, [a]);',
        '  if (!visible) return null;',
        '  return null;',
        '};',
      ])
    ).toEqual([]);
  });
});
