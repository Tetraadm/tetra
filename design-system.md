# Tetra Enterprise Design System
## Nordic Technical Aesthetic

### Design Philosophy
En moderne, nordisk-inspirert enterprise-stil som balanserer funksjonalitet med subtil elegans. Fokus på presisjon, klarhet, og en profesjonell tilnærming til HMS-administrasjon.

---

## Design Tokens

### Colors

```css
:root {
  /* Base Palette - Slate/Charcoal foundation */
  --color-slate-50: #F8FAFB;
  --color-slate-100: #F1F4F6;
  --color-slate-200: #E4E9ED;
  --color-slate-300: #CBD5DD;
  --color-slate-400: #9AA8B5;
  --color-slate-500: #6B7A8A;
  --color-slate-600: #4A5A6A;
  --color-slate-700: #2F3D4A;
  --color-slate-800: #1E2932;
  --color-slate-900: #0F1419;

  /* Primary - Deep Petrol/Teal */
  --color-primary-50: #E6F5F5;
  --color-primary-100: #CCE8E8;
  --color-primary-200: #99D1D1;
  --color-primary-300: #66BABA;
  --color-primary-400: #338A8A;
  --color-primary-500: #0A6D6D;
  --color-primary-600: #085858;
  --color-primary-700: #064343;
  --color-primary-800: #042E2E;
  --color-primary-900: #021919;

  /* Accent - Warm Amber */
  --color-accent-50: #FFF9EB;
  --color-accent-100: #FFF0CC;
  --color-accent-200: #FFE099;
  --color-accent-300: #FFD166;
  --color-accent-400: #FFC233;
  --color-accent-500: #FFB300;
  --color-accent-600: #CC8F00;
  --color-accent-700: #996B00;
  --color-accent-800: #664700;
  --color-accent-900: #332400;

  /* Semantic Colors */
  --color-success-500: #10B981;
  --color-success-600: #059669;
  --color-warning-500: #F59E0B;
  --color-warning-600: #D97706;
  --color-danger-500: #EF4444;
  --color-danger-600: #DC2626;

  /* Backgrounds */
  --bg-primary: #FFFFFF;
  --bg-secondary: var(--color-slate-50);
  --bg-tertiary: var(--color-slate-100);
  --bg-elevated: #FFFFFF;

  /* Borders */
  --border-subtle: var(--color-slate-200);
  --border-default: var(--color-slate-300);
  --border-emphasis: var(--color-slate-400);

  /* Text */
  --text-primary: var(--color-slate-900);
  --text-secondary: var(--color-slate-600);
  --text-tertiary: var(--color-slate-500);
  --text-inverse: #FFFFFF;
}
```

### Typography

```css
/* Font Families */
--font-sans: 'Sora', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'DM Mono', 'Courier New', monospace;

/* Font Sizes */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

### Spacing

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
```

### Border Radius

```css
--radius-sm: 0.375rem;   /* 6px */
--radius-md: 0.5rem;     /* 8px */
--radius-lg: 0.75rem;    /* 12px */
--radius-xl: 1rem;       /* 16px */
--radius-full: 9999px;
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.05);
```

---

## Component Examples

### AppShell Structure

```
┌─────────────────────────────────────────┐
│           Header/TopBar                 │
│  [Logo] [Org] ............. [User][Out] │
├───────┬─────────────────────────────────┤
│       │                                 │
│ Side  │      Main Content Area         │
│ bar   │                                 │
│       │                                 │
│ Nav1  │      [Cards, Tables, etc]      │
│ Nav2  │                                 │
│ Nav3  │                                 │
│ ...   │                                 │
│       │                                 │
└───────┴─────────────────────────────────┘
```

Mobile:
```
┌─────────────────────────────────────────┐
│  [☰] [Logo]  ............. [User][Out] │
├─────────────────────────────────────────┤
│                                         │
│         Main Content Area               │
│                                         │
│         [Cards, Tables, etc]            │
│                                         │
└─────────────────────────────────────────┘
```

### Layout Dimensions

- **Sidebar Width**: 280px (desktop)
- **Header Height**: 64px
- **Content Max Width**: 1400px
- **Content Padding**: 32px (desktop), 16px (mobile)
- **Breakpoints**:
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px

---

## Tailwind Configuration Extensions

Add to `tailwind.config.js`:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#F8FAFB',
          100: '#F1F4F6',
          200: '#E4E9ED',
          300: '#CBD5DD',
          400: '#9AA8B5',
          500: '#6B7A8A',
          600: '#4A5A6A',
          700: '#2F3D4A',
          800: '#1E2932',
          900: '#0F1419',
        },
        primary: {
          50: '#E6F5F5',
          100: '#CCE8E8',
          200: '#99D1D1',
          300: '#66BABA',
          400: '#338A8A',
          500: '#0A6D6D',
          600: '#085858',
          700: '#064343',
          800: '#042E2E',
          900: '#021919',
        },
        accent: {
          50: '#FFF9EB',
          100: '#FFF0CC',
          200: '#FFE099',
          300: '#FFD166',
          400: '#FFC233',
          500: '#FFB300',
          600: '#CC8F00',
          700: '#996B00',
          800: '#664700',
          900: '#332400',
        }
      },
      fontFamily: {
        sans: ['Sora', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
    },
  },
}
```

---

## Norwegian Text Labels

**Navigation:**
- Oversikt (Home/Overview)
- Brukere (Users)
- Team (Teams)
- Instrukser (Instructions)
- Avvik & Varsler (Deviations & Alerts)
- AI-logg (AI Log)
- Innsikt (Insights)
- Aktivitetslogg (Activity Log)
- Lesebekreftelser (Read Confirmations)

**Actions:**
- Opprett (Create)
- Rediger (Edit)
- Slett (Delete)
- Lagre (Save)
- Avbryt (Cancel)
- Last ned (Download)
- Last opp (Upload)
- Logg ut (Log out)
- Søk (Search)
- Filtrer (Filter)

**States:**
- Laster... (Loading...)
- Lagrer... (Saving...)
- Ingen data (No data)
- Feil oppstod (Error occurred)
- Vellykket (Success)

