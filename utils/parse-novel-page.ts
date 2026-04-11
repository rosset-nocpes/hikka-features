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

  const page = new DOMParser().parseFromString(sanitizedHtml, 'text/html');
  page.querySelectorAll('p span').forEach((el) => {
    while (el.firstChild) {
      el.parentNode?.insertBefore(el.firstChild, el);
    }
    el.remove();
  });

  const definitionsMap = new Map<number, string>();

  const explanationHeader = [
    ...page.querySelectorAll('p, h1, h2, h3, div'),
  ].filter((el) => {
    const cleanText = el.textContent
      .replace(/[^\p{L}\p{N}\s]/gu, '')
      .trim()
      .toLowerCase();

    return cleanText === 'пояснення';
  })[0];

  function getNextAll(el: Element) {
    const siblings = [];
    while ((el = el.nextElementSibling)) {
      siblings.push(el);
    }
    return siblings;
  }

  if (explanationHeader) {
    let currentAutoIndex = 1;
    getNextAll(explanationHeader).forEach((el) => {
      const text = el.textContent.trim();
      if (!text) return;

      const numberMatch = text.match(/^(\d+)[.)]\s*(.*)/);
      let definitionText = text;
      let index = currentAutoIndex;

      if (numberMatch) {
        index = parseInt(numberMatch[1], 10);
        definitionText = numberMatch[2];
        currentAutoIndex = index + 1;
      } else {
        currentAutoIndex++;
      }

      definitionsMap.set(index, definitionText.trim());

      if (el.querySelectorAll('img').length === 0) {
        el.remove();
      } else {
        el.childNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            node.remove();
          }
        });
      }
    });
    explanationHeader.remove();
  }

  const superscriptRegex =
    /(«[^»]+»|"[^"]+"|'[^']+'|[^\s¹²³⁴⁵⁶⁷⁸⁹⁰.,!?;:]+)([.,!?;:]?)([¹²³⁴⁵⁶⁷⁸⁹⁰]+)/gu;

  Array.from(page.querySelectorAll('p, li, span, td'))
    .flatMap((el) => Array.from(el.childNodes))
    .forEach((el) => {
      if (el.nodeType === Node.TEXT_NODE) {
        const originalText = el.textContent!;

        if (superscriptRegex.test(originalText)) {
          superscriptRegex.lastIndex = 0; // Reset state

          const newHtml = originalText.replace(
            superscriptRegex,
            (match, term, punctuation, superscripts) => {
              const index = parseSuperscriptToIndex(superscripts);
              const definition = definitionsMap
                .get(index)
                ?.replaceAll(/"/g, '&quot;');

              if (definition) {
                const fullTermWithPunctuation = term + punctuation;
                const escapedTerm = fullTermWithPunctuation.replace(
                  /"/g,
                  '&quot;',
                );

                return `<span class="hover-card-trigger" data-definition="${definition}" data-term="${escapedTerm}">${fullTermWithPunctuation}${superscripts}</span>`;
              }
              return match;
            },
          );

          el.replaceWith(newHtml);
        }
      }
    });

  return page.body.innerHTML || '';
};
