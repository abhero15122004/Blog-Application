import React, { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Fixed bottom-right button that smooth-scrolls to top of the page.
 * Appears once the user has scrolled past `threshold` pixels.
 */
export const ScrollToTop = ({ threshold = 600 }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      window.requestAnimationFrame(() => {
        setVisible(window.scrollY > threshold);
        ticking = false;
      });
      ticking = true;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  const goTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <button
      onClick={goTop}
      aria-label="Scroll to top"
      className={cn(
        "fixed bottom-6 right-6 z-40 w-12 h-12 flex items-center justify-center",
        "border border-ink bg-bg text-ink",
        "shadow-brutal transition-all duration-300 ease-brutal",
        "hover:bg-accent hover:text-accent-ink hover:border-accent hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-3 pointer-events-none"
      )}
    >
      <ArrowUp size={18} />
    </button>
  );
};

export default ScrollToTop;
