import { useEffect, useState } from 'react';

/**
 * Copies text to the clipboard and remembers what was copied for a moment,
 * e.g. to show a check mark. `key` tells several copy buttons apart.
 */
export const useCopy = (resetMs = 2000) => {
  const [copied, setCopied] = useState<string>();

  useEffect(() => {
    if (copied === undefined) return;
    const timeout = setTimeout(() => setCopied(undefined), resetMs);
    return () => clearTimeout(timeout);
  }, [copied, resetMs]);

  const copy = (text: string, key = text) =>
    navigator.clipboard.writeText(text).then(() => setCopied(key));

  return { copied, copy, clear: () => setCopied(undefined) };
};
