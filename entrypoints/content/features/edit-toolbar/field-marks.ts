import type { FieldIssue, IssueSeverity, TextRange } from './edit-checks';
import type { CheckedEditField } from './use-edit-page';

import { isTextInput, richText } from './edit-fields';

/** An issue's place on the page, to find under the pointer. */
export interface FieldMark {
  issue: FieldIssue;
  /** What's said of it here: its range's own note, or the issue's message. */
  text: string;
  range: Range;
  /** The box the range is cut to, a mirror's being its input's. */
  clip?: HTMLElement;
}

const HIGHLIGHTS: Record<IssueSeverity, { name: string; priority: number }> = {
  error: { name: 'hf-check-error', priority: 3 },
  warning: { name: 'hf-check-warning', priority: 2 },
  hint: { name: 'hf-check-hint', priority: 1 },
};

/**
 * In the page's own styles, as highlights paint by the styles of the text
 * they're on. hikka.io's `--destructive` and `--warning` are dark
 * backgrounds, so the reds and ambers are set here, bright on either theme.
 */
const PAGE_CSS = `
::highlight(hf-check-error) {
  background-color: color-mix(in oklab, var(--hf-check-error) 22%, transparent);
  text-decoration: underline wavy var(--hf-check-error) 1px;
  text-decoration-skip-ink: none;
}
::highlight(hf-check-warning) {
  background-color: color-mix(in oklab, var(--hf-check-warning) 22%, transparent);
  text-decoration: underline wavy var(--hf-check-warning) 1px;
  text-decoration-skip-ink: none;
}
::highlight(hf-check-hint) {
  text-decoration: underline dotted var(--hf-check-hint) 2px;
  text-decoration-skip-ink: none;
}
:root {
  --hf-check-error: oklch(0.65 0.22 25);
  --hf-check-warning: oklch(0.78 0.16 75);
  --hf-check-hint: var(--muted-foreground, oklch(0.71 0.013 286));
}
`;

/** What a mirror takes from its input to lay its text out the same. */
const MIRRORED = [
  'boxSizing',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'fontStretch',
  'fontVariant',
  'fontFeatureSettings',
  'fontKerning',
  'letterSpacing',
  'wordSpacing',
  'textTransform',
  'textIndent',
  'textAlign',
  'direction',
  'tabSize',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'lineHeight',
] as const;

const supported = () => typeof Highlight === 'function' && 'highlights' in CSS;

/** `range` of a run of text nodes, or undefined when they no longer reach. */
const domRange = (
  nodes: { node: Text; start: number }[],
  [start, end]: TextRange,
) => {
  // A start opens the node it's in, an end closes the one it's after.
  const at = (offset: number, isEnd: boolean) => {
    const found = nodes.find(({ node, start: from }) =>
      isEnd
        ? from < offset && offset <= from + node.data.length
        : from <= offset && offset < from + node.data.length,
    );
    return found && ([found.node, offset - found.start] as const);
  };
  const from = at(start, false);
  const to = at(end, true);
  if (!from || !to) return;
  const range = document.createRange();
  range.setStart(...from);
  range.setEnd(...to);
  return range;
};

/**
 * Marks the fields' issues in their text: highlights on rich text, and on a
 * see-through copy laid over each input, whose text the page can't reach.
 */
export class FieldMarks {
  marks: FieldMark[] = [];
  private readonly style = document.createElement('style');
  private readonly layer = document.createElement('div');
  private readonly mirrors = new Map<
    HTMLInputElement | HTMLTextAreaElement,
    HTMLDivElement
  >();
  private readonly resizes = new ResizeObserver(() => this.sync());
  readonly enabled = supported();

  constructor() {
    if (!this.enabled) return;
    this.style.textContent = PAGE_CSS;
    this.layer.setAttribute('data-hf-field-marks', '');
    Object.assign(this.layer.style, {
      position: 'fixed',
      inset: '0',
      overflow: 'hidden',
      pointerEvents: 'none',
    });
    document.head.append(this.style);
    document.body.append(this.layer);
  }

  update(fields: CheckedEditField[]) {
    if (!this.enabled) return;
    const ranges: Record<IssueSeverity, Range[]> = {
      error: [],
      warning: [],
      hint: [],
    };
    const marks: FieldMark[] = [];
    const mirrored = new Set<HTMLElement>();

    for (const field of fields) {
      const marked = field.issues.filter((issue) => issue.ranges?.length);
      if (!marked.length) continue;
      const control = field.element;

      let nodes: { node: Text; start: number }[];
      let clip: HTMLElement | undefined;
      if (isTextInput(control)) {
        const mirror = this.mirrorOf(control, field.text);
        mirrored.add(control);
        nodes = [{ node: mirror.firstChild as Text, start: 0 }];
        clip = mirror;
      } else {
        const read = richText(control);
        // Changed since it was checked: the next check marks it.
        if (read.text !== field.text) continue;
        nodes = read.nodes;
      }

      for (const issue of marked) {
        for (const textRange of issue.ranges!) {
          const range = domRange(nodes, textRange);
          if (!range) continue;
          ranges[issue.severity].push(range);
          marks.push({
            issue,
            text: textRange[2] ?? issue.message,
            range,
            clip,
          });
        }
      }
    }

    for (const [input, mirror] of this.mirrors) {
      if (mirrored.has(input)) continue;
      mirror.remove();
      this.mirrors.delete(input);
      this.resizes.unobserve(input);
    }
    for (const severity of Object.keys(HIGHLIGHTS) as IssueSeverity[]) {
      const { name, priority } = HIGHLIGHTS[severity];
      if (!ranges[severity].length) {
        CSS.highlights.delete(name);
        continue;
      }
      const highlight = new Highlight(...ranges[severity]);
      highlight.priority = priority;
      CSS.highlights.set(name, highlight);
    }
    this.marks = marks;
    this.sync();
  }

  /** The copy of `input`'s text, set out like it. */
  private mirrorOf(
    input: HTMLInputElement | HTMLTextAreaElement,
    text: string,
  ) {
    let mirror = this.mirrors.get(input);
    if (!mirror) {
      mirror = document.createElement('div');
      mirror.setAttribute('aria-hidden', 'true');
      this.layer.append(mirror);
      this.mirrors.set(input, mirror);
      this.resizes.observe(input);
    }
    // A text node of its own, as the ranges are on it; an input's `value`
    // is its text whatever the page renders.
    mirror.replaceChildren(document.createTextNode(text));

    const style = getComputedStyle(input);
    const multiline = input instanceof HTMLTextAreaElement;
    Object.assign(
      mirror.style,
      Object.fromEntries(MIRRORED.map((name) => [name, style[name]])),
      {
        position: 'absolute',
        top: '0',
        left: '0',
        margin: '0',
        overflow: 'hidden',
        borderStyle: 'solid',
        borderColor: 'transparent',
        color: 'transparent',
        whiteSpace: multiline ? 'pre-wrap' : 'pre',
        overflowWrap: multiline ? 'break-word' : 'normal',
      },
    );
    if (multiline) {
      // The textarea's scrollbar narrows its text.
      const scrollbar =
        input.offsetWidth -
        input.clientWidth -
        parseFloat(style.borderLeftWidth) -
        parseFloat(style.borderRightWidth);
      mirror.style.paddingRight = `${parseFloat(style.paddingRight) + scrollbar}px`;
    } else {
      // An input centres its one line in its height.
      const height =
        input.clientHeight -
        parseFloat(style.paddingTop) -
        parseFloat(style.paddingBottom);
      mirror.style.lineHeight = `${height}px`;
    }
    return mirror;
  }

  /** Lays each mirror over its input as it moves and scrolls. */
  sync() {
    for (const [input, mirror] of this.mirrors) {
      const rect = input.getBoundingClientRect();
      // Typed in since it was checked: the next check marks it again.
      mirror.hidden =
        !input.isConnected || !rect.width || input.value !== mirror.textContent;
      if (mirror.hidden) continue;
      Object.assign(mirror.style, {
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        transform: `translate(${rect.left}px, ${rect.top}px)`,
      });
      mirror.scrollLeft = input.scrollLeft;
      mirror.scrollTop = input.scrollTop;
    }
  }

  /**
   * The issues marked at a point, each with what's said of it there, and
   * the piece of text they're on.
   */
  at(x: number, y: number) {
    const inside = (rect: DOMRect) =>
      x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    const issues = new Map<FieldIssue, string>();
    let found: { range: Range; index: number } | undefined;
    for (const { issue, text, range, clip } of this.marks) {
      if (clip && !inside(clip.getBoundingClientRect())) continue;
      const index = [...range.getClientRects()].findIndex(inside);
      if (index < 0) continue;
      if (!issues.has(issue)) issues.set(issue, text);
      found ??= { range, index };
    }
    return (
      found && {
        ...found,
        issues: [...issues].map(([issue, text]) => ({ issue, text })),
      }
    );
  }

  destroy() {
    if (!this.enabled) return;
    for (const { name } of Object.values(HIGHLIGHTS)) {
      CSS.highlights.delete(name);
    }
    this.resizes.disconnect();
    this.style.remove();
    this.layer.remove();
  }
}
