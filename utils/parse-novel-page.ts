import * as cheerio from 'cheerio';
import DOMPurify from 'dompurify';

const SUPER_TO_NUM: Record<string, string> = {
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9',
  '⁰': '0',
};

const escapeHtml = (value: string, attribute = false) => {
  const escaped = value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
  return attribute ? escaped.replaceAll('"', '&quot;') : escaped;
};

const parseSuperscriptToIndex = (superscripts: string): number => {
  return parseInt(
    superscripts
      .split('')
      .map((s) => SUPER_TO_NUM[s] || '')
      .join(''),
    10,
  );
};

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
    let currentAutoIndex = 1;
    explanationHeader.nextAll().each((_, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      if (!text) return;

      const numberMatch = text.match(/^(\d+)[.)]\s*(.*)/);
      let definitionText = text;
      let index = currentAutoIndex;

      if (numberMatch) {
        index = parseInt(numberMatch[1]!, 10);
        definitionText = numberMatch[2]!;
        currentAutoIndex = index + 1;
      } else {
        currentAutoIndex++;
      }

      definitionsMap.set(index, definitionText.trim());

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
      superscriptRegex.lastIndex = 0;
      if (!superscriptRegex.test(text)) return;

      superscriptRegex.lastIndex = 0;
      const html = text.replace(
        superscriptRegex,
        (match, term: string, punctuation: string, superscripts: string) => {
          const definition = definitionsMap.get(
            parseSuperscriptToIndex(superscripts),
          );
          if (!definition) return match;

          const termWithPunctuation = term + punctuation;
          return `<span class="hover-card-trigger" data-definition="${escapeHtml(definition, true)}" data-term="${termWithPunctuation.replaceAll('"', '&quot;')}">${termWithPunctuation}${superscripts}</span>`;
        },
      );
      $(this).replaceWith(html);
    });

  return $('body').html() || '';
};
