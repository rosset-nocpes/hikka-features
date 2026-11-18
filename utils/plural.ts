const rules = new Intl.PluralRules('uk');

/**
 * A word's forms for counts: "1 епізод", "2 епізоди", "5 епізодів", and
 * for fractions (`other`), the `many` form unless given.
 */
export interface PluralForms {
  one: string;
  few: string;
  many: string;
  other?: string;
}

/** The form of the word that goes with `count`. */
export function plural(count: number, forms: PluralForms) {
  const form = rules.select(count);
  if (form === 'one' || form === 'few') return forms[form];
  return form === 'other' ? (forms.other ?? forms.many) : forms.many;
}
