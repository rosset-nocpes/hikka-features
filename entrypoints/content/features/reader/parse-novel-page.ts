import DOMPurify from 'dompurify';

/** Superscript digits, each at its value. */
const SUPERSCRIPT_DIGITS = '⁰¹²³⁴⁵⁶⁷⁸⁹';

const escapeHtml = (value: string, attribute = false) => {
  const escaped = value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
  return attribute ? escaped.replaceAll('"', '&quot;') : escaped;
};

const superscriptNumber = (superscripts: string) =>
  Number([...superscripts].map((d) => SUPERSCRIPT_DIGITS.indexOf(d)).join(''));

/** The elements after `element` among its siblings. */
const followingSiblings = (element: Element) => {
  const siblings: Element[] = [];
  for (let next = element.nextElementSibling; next;) {
    siblings.push(next);
    next = next.nextElementSibling;
  }
  return siblings;
};

const directTextNodes = (element: Element) =>
  [...element.childNodes].filter(
    (node): node is Text => node.nodeType === Node.TEXT_NODE,
  );

/**
 * A novel chapter's HTML, sanitised, with its "Пояснення" (footnotes) turned
 * into hover cards on the words they explain (`hover-card-trigger` spans).
 * Works on an inert document: nothing in it runs or loads.
 */
export const parseNovelPage = (html: string): string => {
  const body = DOMPurify.sanitize(html, {
    FORBID_ATTR: ['class', 'style'],
    RETURN_DOM: true,
  }) as HTMLElement;
  const document = body.ownerDocument;

  for (const span of body.querySelectorAll('p span')) {
    span.replaceWith(...span.childNodes);
  }

  const definitionsMap = new Map<number, string>();

  const explanationHeaders = [
    ...body.querySelectorAll('p, h1, h2, h3, div'),
  ].filter(
    (element) =>
      (element.textContent ?? '')
        .replace(/[^\p{L}\p{N}\s]/gu, '')
        .trim()
        .toLowerCase() === 'пояснення',
  );

  if (explanationHeaders.length > 0) {
    // What follows the headers, once each, in the page's order.
    const definitions = [
      ...new Set(explanationHeaders.flatMap(followingSiblings)),
    ].sort((left, right) =>
      left.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING
        ? -1
        : 1,
    );
    // Unnumbered definitions follow on from the one before.
    let nextIndex = 1;
    for (const element of definitions) {
      const text = element.textContent?.trim();
      if (!text) continue;

      const [, number, definition] = text.match(/^(\d+)[.)]\s*(.*)/) ?? [];
      const index = number ? parseInt(number, 10) : nextIndex;
      nextIndex = index + 1;
      definitionsMap.set(index, (definition ?? text).trim());

      if (!element.querySelector('img')) {
        element.remove();
      } else {
        for (const node of directTextNodes(element)) node.remove();
      }
    }
    for (const header of explanationHeaders) header.remove();
  }

  const superscriptRegex =
    /(«[^»]+»|"[^"]+"|'[^']+'|[^\s¹²³⁴⁵⁶⁷⁸⁹⁰.,!?;:]+)([.,!?;:]?)([¹²³⁴⁵⁶⁷⁸⁹⁰]+)/gu;

  if (definitionsMap.size > 0) {
    // Taken before any change, so the spans added aren't read again.
    const textNodes = [...body.querySelectorAll('p, li, span, td')].flatMap(
      directTextNodes,
    );
    for (const node of textNodes) {
      // Text nodes hold decoded text; it goes back into the page as HTML.
      const text = escapeHtml(node.data);
      const replaced = text.replace(
        superscriptRegex,
        (match, term: string, punctuation: string, superscripts: string) => {
          const definition = definitionsMap.get(
            superscriptNumber(superscripts),
          );
          if (!definition) return match;

          const termWithPunctuation = term + punctuation;
          return `<span class="hover-card-trigger" data-definition="${escapeHtml(definition, true)}" data-term="${termWithPunctuation.replaceAll('"', '&quot;')}">${termWithPunctuation}${superscripts}</span>`;
        },
      );
      if (replaced === text) continue;
      const template = document.createElement('template');
      template.innerHTML = replaced;
      node.replaceWith(template.content);
    }
  }

  return body.innerHTML;
};
