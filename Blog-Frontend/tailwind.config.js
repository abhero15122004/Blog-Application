import animatePlugin from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx,jsx,js}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
      },
      colors: {
        // Brand tokens (CSS vars so we can theme later)
        bg: 'var(--bg)',
        surface: {
          DEFAULT: 'var(--surface)',
          2: 'var(--surface-2)',
          hover: 'var(--surface-hover)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          muted: 'var(--ink-muted)',
          subtle: 'var(--ink-subtle)',
          faint: 'var(--ink-faint)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          ink: 'var(--accent-ink)',
          glow: 'var(--accent-glow)',
        },
        danger: 'var(--danger)',
        success: 'var(--success)',

        // Legacy literals kept for backward compatibility
        black: '#000000',
        white: '#FFFFFF',
        platinum: '#E5E4E2',
        mercury: '#D8D8D8',
        transparent: 'transparent',
        current: 'currentColor',

        // Shadcn (HSL)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        none: '0',
        sm: '0',
        md: '0',
        lg: '0',
        xl: '0',
        full: '9999px',
      },
      boxShadow: {
        brutal: '0 24px 64px -24px rgba(255,255,255,0.18)',
        glow: '0 0 0 1px var(--accent), 0 0 32px var(--accent-glow)',
        sharp: '8px 8px 0 0 var(--accent)',
        'sharp-white': '8px 8px 0 0 #FFFFFF',
        'sharp-sm': '4px 4px 0 0 var(--accent)',
        none: 'none',
      },
      transitionTimingFunction: {
        brutal: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'gradient-wipe': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        float: 'float 6s ease-in-out infinite',
        'gradient-wipe': 'gradient-wipe 1.5s ease-in-out',
        'fade-up': 'fade-up 380ms cubic-bezier(0.215, 0.61, 0.355, 1) both',
        'pulse-dot': 'pulse-dot 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [animatePlugin],
};
