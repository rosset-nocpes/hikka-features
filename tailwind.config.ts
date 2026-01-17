import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class', '[data-kb-theme="dark"]'],
  content: ['./components/**/*.tsx', './entrypoints/**/*.tsx'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      gridAutoColumns: {
        scroll: 'minmax(var(--grid-min, 7rem), var(--grid-max, 1fr))',
      },
      gridTemplateColumns: {
        scroll:
          'repeat(auto-fill, minmax(var(--grid-min, 7rem), var(--grid-max, 1fr)))',
      },
      colors: {
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
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        error: {
          DEFAULT: 'hsl(var(--error))',
          foreground: 'hsl(var(--error-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        xl: 'calc(var(--radius) + 4px)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'collapsible-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-collapsible-content-height)',
          },
        },
        'collapsible-up': {
          from: {
            height: 'var(--radix-collapsible-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'content-show': {
          from: {
            opacity: '0',
            transform: 'scale(0.96)',
          },
          to: {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        'content-hide': {
          from: {
            opacity: '1',
            transform: 'scale(1)',
          },
          to: {
            opacity: '0',
            transform: 'scale(0.96)',
          },
        },
      },
      animation: {
        'collapsible-down': 'collapsible-down 200ms ease-out',
        'collapsible-up': 'collapsible-up 200ms ease-out',
        'content-show': 'content-show 0.1s ease-out',
        'content-hide': 'content-hide 0.1s ease-out',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        nunitosans: ['Nunito Sans Variable', 'sans-serif'],
        roboto: ['Roboto Variable', 'sans-serif'],
        literata: ['Literata Variable', 'serif'],
        ebgaramond: ['EB Garamond Variable', 'serif'],
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('tailwind-gradient-mask-image'),
    require('@vidstack/react/tailwind.cjs'),
  ],
} satisfies Config;
