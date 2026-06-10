import { useEffect, useState } from "react";

/**
 * Focus a ref'd input when the user presses ⌘K (mac) or Ctrl+K (everywhere
 * else). "/" (when not already in a text field) also focuses. Esc blurs.
 *
 * Returns { isMac } so callers can render the right hint chip.
 */
export const useSearchHotkey = (inputRef) => {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(
      typeof navigator !== "undefined" &&
        /mac|iphone|ipad/i.test(navigator.userAgent)
    );
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const el = inputRef?.current;
      const target = e.target;
      const inField =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      // ⌘K / Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        el?.focus();
        el?.select?.();
        return;
      }
      // "/" focus when not already in a field
      if (e.key === "/" && !inField) {
        e.preventDefault();
        el?.focus();
        el?.select?.();
        return;
      }
      // Esc blurs and clears focus from input
      if (e.key === "Escape" && document.activeElement === el) {
        el?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inputRef]);

  return { isMac };
};

export default useSearchHotkey;
