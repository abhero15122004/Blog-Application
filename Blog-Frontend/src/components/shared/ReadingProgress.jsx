import React, { useEffect, useState } from "react";

/**
 * Thin lime bar pinned to the top of the viewport that fills as the user
 * scrolls. Reads the *document* scroll position, not a specific container,
 * so it just works on any page.
 */
export const ReadingProgress = ({ targetRef }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    const compute = () => {
      const el = targetRef?.current;
      let percent = 0;
      if (el) {
        const rect = el.getBoundingClientRect();
        const viewportH = window.innerHeight;
        const total = Math.max(1, rect.height - viewportH);
        const scrolled = Math.min(total, Math.max(0, -rect.top));
        percent = (scrolled / total) * 100;
      } else {
        const doc = document.documentElement;
        const total = Math.max(1, doc.scrollHeight - doc.clientHeight);
        percent = (doc.scrollTop / total) * 100;
      }
      setProgress(Math.min(100, Math.max(0, percent)));
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(compute);
        ticking = true;
      }
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [targetRef]);

  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 z-[60] h-0.5 bg-transparent pointer-events-none"
    >
      <div
        className="h-full bg-accent shadow-[0_0_8px_var(--accent-glow)] transition-[width] duration-100 ease-linear"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default ReadingProgress;
