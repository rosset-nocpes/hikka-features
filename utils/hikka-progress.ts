/** The tracker on a title's page: its progress and its "+1" button. */
const TRACKER =
  '#content-left-side > div > div:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(2)';

/** Episodes or chapters the user marked as watched or read on hikka.io. */
export const getHikkaProgress = (): number => {
  const value = document.querySelector(`${TRACKER} span span`)?.firstChild
    ?.nodeValue;
  return value ? parseInt(value, 10) : 0;
};

/** Marks one more as watched or read, as the tracker's "+1" does. */
export const advanceHikkaProgress = () =>
  document
    .querySelector<HTMLButtonElement>(`${TRACKER} button:nth-of-type(2)`)
    ?.click();
