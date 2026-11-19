/**
 * Types `value` into one of hikka.io's form inputs. The site's React state
 * follows the input event, as if the user had typed it.
 */
export const fillInput = (
  input: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) => {
  input.value = value;
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
};
