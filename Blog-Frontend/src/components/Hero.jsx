import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();

    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * w(),
      y: Math.random() * h(),
      r: Math.random() * 1.4 + 0.4,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      opacity: Math.random() * 0.4 + 0.15,
      accent: Math.random() > 0.92,
    }));

    const tick = () => {
      ctx.clearRect(0, 0, w(), h());
      for (const p of particles) {
        if (!reduced) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x > w()) p.x = 0;
          else if (p.x < 0) p.x = w();
          if (p.y > h()) p.y = 0;
          else if (p.y < 0) p.y = h();
        }
        ctx.fillStyle = p.accent
          ? `rgba(212, 255, 0, ${Math.min(p.opacity + 0.25, 0.9)})`
          : `rgba(255, 255, 255, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section className="relative min-h-[calc(100vh-5rem)] w-full overflow-hidden mt-20 grid-bg">
      {/* Particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-0 pointer-events-none"
        aria-hidden
      />

      {/* Top-left + bottom-right accent crosshairs */}
      <Crosshair className="top-8 left-6 hidden md:block" />
      <Crosshair className="bottom-12 right-6 hidden md:block" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-5rem)] flex flex-col">
        <div className="flex-1 flex items-center justify-center py-16">
          <div className="max-w-4xl text-center">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-3 px-3 py-1.5 mb-10 border border-accent/40 bg-accent/5 animate-fade-up">
              <Sparkles size={14} className="text-accent" />
              <span className="micro-text text-accent">
                AI-powered summaries, now live
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-heading font-bold tracking-tight leading-[0.9] text-balance animate-fade-up [animation-delay:60ms]">
              Ideas worth
              <br />
              <span className="inline-flex items-center gap-3 md:gap-5">
                <span className="inline-block h-[0.65em] w-[0.6em] bg-accent translate-y-[2px]" />
                <span>shipping</span>
                <span className="text-accent">.</span>
              </span>
            </h1>

            {/* Subhead */}
            <p className="mt-7 text-lg md:text-xl text-ink-muted max-w-2xl mx-auto leading-relaxed text-balance animate-fade-up [animation-delay:120ms]">
              A brutalist writing space for developers. Long-form posts, code
              that actually works, AI that summarises, comments that matter.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center animate-fade-up [animation-delay:180ms]">
              <Button asChild variant="accent" size="xl">
                <Link to="/write-blog">
                  Start writing
                  <ArrowRight size={18} />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link to="/blogs">Explore blogs</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-px bg-ink-faint border border-ink-faint max-w-2xl mx-auto animate-fade-up [animation-delay:240ms]">
              <Stat value="Markdown" label="Native support" />
              <Stat value="OAuth" label="Google & GitHub" />
              <Stat value="Live" label="Subscriptions" />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hidden md:flex items-center justify-center pb-8 animate-fade-up [animation-delay:320ms]">
          <div className="flex flex-col items-center gap-2 text-ink-subtle">
            <span className="micro-text">Scroll</span>
            <ChevronDown size={16} className="animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
};

const Stat = ({ value, label }) => (
  <div className="bg-bg p-5 md:p-6">
    <div className="text-lg md:text-xl font-heading font-bold text-ink">
      {value}
    </div>
    <div className="mt-1 micro-text text-ink-subtle">{label}</div>
  </div>
);

const Crosshair = ({ className = "" }) => (
  <div
    aria-hidden
    className={`absolute z-0 text-accent/40 ${className}`}
  >
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2v8m0 4v8M2 12h8m4 0h8"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  </div>
);

export default Hero;
