/** The tracker on a title's page: its progress and its "+1" button. */
const TRACKER =
  '#content-left-side > div > div:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(2)';

/** The progress the user tracks on a title's hikka.io page. */
export const hikkaTracker = {
  /** Episodes or chapters marked as watched or read. */
  get progress(): number {
    const value = document.querySelector(`${TRACKER} span span`)?.firstChild
      ?.nodeValue;
    return value ? parseInt(value, 10) : 0;
  },

  /** Marks one more as watched or read, as the tracker's "+1" does. */
  advance() {
    document
      .querySelector<HTMLButtonElement>(`${TRACKER} button:nth-of-type(2)`)
      ?.click();
  },
};
