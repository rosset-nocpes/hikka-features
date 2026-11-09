import * as cheerio from 'cheerio';
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

export const parseNovelPage = (html: string) => {
  const sanitizedHtml = DOMPurify.sanitize(html, {
    FORBID_ATTR: ['class', 'style'],
  });

  const $ = cheerio.load(sanitizedHtml);
  $('p span').each(function () {
    $(this).replaceWith($(this).contents());
  });

  const definitionsMap = new Map<number, string>();

  const explanationHeader = $('p, h1, h2, h3, div').filter((_, el) => {
    const cleanText = $(el)
      .text()
      .replace(/[^\p{L}\p{N}\s]/gu, '')
      .trim()
      .toLowerCase();

    return cleanText === 'пояснення';
  });

  if (explanationHeader.length > 0) {
    // Unnumbered definitions follow on from the one before.
    let nextIndex = 1;
    explanationHeader.nextAll().each((_, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      if (!text) return;

      const [, number, definition] = text.match(/^(\d+)[.)]\s*(.*)/) ?? [];
      const index = number ? parseInt(number, 10) : nextIndex;
      nextIndex = index + 1;
      definitionsMap.set(index, (definition ?? text).trim());

      if ($el.find('img').length === 0) {
        $el.remove();
      } else {
        $el
          .contents()
          .filter(function () {
            return this.type === 'text';
          })
          .remove();
      }
    });
    explanationHeader.remove();
  }

  const superscriptRegex =
    /(«[^»]+»|"[^"]+"|'[^']+'|[^\s¹²³⁴⁵⁶⁷⁸⁹⁰.,!?;:]+)([.,!?;:]?)([¹²³⁴⁵⁶⁷⁸⁹⁰]+)/gu;

  $('p, li, span, td')
    .contents()
    .each(function () {
      if (this.type !== 'text') return;
      // Text nodes hold decoded text; it goes back into the page as HTML.
      const text = escapeHtml($(this).text());
      const html = text.replace(
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
      if (html !== text) $(this).replaceWith(html);
    });

  return $('body').contents().toArray();
};
