# Tetra Design System Kit 🎨

Hei! Her er "oppskriften" på Tetra-designet. Følg stegene under for å få nøyaktig samme stil, farger og fonter i ditt Next.js prosjekt.

---

## Steg 1: Installer nødvendige pakker

Kjør denne kommandoen i terminalen din (i prosjektmappen):

```bash
npm install tailwindcss-animate class-variance-authority clsx tailwind-merge lucide-react
```

Hvis du vil ha ferdige komponenter (knapper, cards, inputs), kjør også:
```bash
npx shadcn@latest init
# (Velg defaults, men si JA til CSS variables)
```

---

## Steg 2: Konfigurasjon (`tailwind.config.ts`)

Bytt ut innholdet i din `tailwind.config.ts` med dette:

```typescript
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
	darkMode: ["class"],
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				background: 'var(--background)',
				foreground: 'var(--foreground)',
				card: {
					DEFAULT: 'var(--card)',
					foreground: 'var(--card-foreground)'
				},
				popover: {
					DEFAULT: 'var(--popover)',
					foreground: 'var(--popover-foreground)'
				},
				primary: {
					DEFAULT: 'var(--primary)',
					foreground: 'var(--primary-foreground)'
				},
				secondary: {
					DEFAULT: 'var(--secondary)',
					foreground: 'var(--secondary-foreground)'
				},
				muted: {
					DEFAULT: 'var(--muted)',
					foreground: 'var(--muted-foreground)'
				},
				accent: {
					DEFAULT: 'var(--accent)',
					foreground: 'var(--accent-foreground)'
				},
				destructive: {
					DEFAULT: 'var(--destructive)',
					foreground: 'var(--destructive-foreground)'
				},
				border: 'var(--border)',
				input: 'var(--input)',
				ring: 'var(--ring)',
				chart: {
					'1': 'var(--chart-1)',
					'2': 'var(--chart-2)',
					'3': 'var(--chart-3)',
					'4': 'var(--chart-4)',
					'5': 'var(--chart-5)'
				},
				sidebar: {
					DEFAULT: 'var(--sidebar)',
					foreground: 'var(--sidebar-foreground)',
					primary: 'var(--sidebar-primary)',
					'primary-foreground': 'var(--sidebar-primary-foreground)',
					accent: 'var(--sidebar-accent)',
					'accent-foreground': 'var(--sidebar-accent-foreground)',
					border: 'var(--sidebar-border)',
					ring: 'var(--sidebar-ring)'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			}
		}
	},
	plugins: [tailwindcssAnimate],
};
export default config;
```

---

## Steg 3: Hjelpefunksjon (`src/lib/utils.ts`)

Sjekk at du har denne filen (hvis ikke, lag den):

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## Steg 4: Selve designet (`src/app/globals.css`)

Dette er den viktigste filen. Kopier **ALT** dette inn i `src/app/globals.css`. Dette gir deg "Tetra Teal" fargene og alt det moderne utseendet.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* ===========================
     TETRA DESIGN TOKENS
     =========================== */

  :root {
    /* Tetra HSE - Clean, professional with teal accent */
    --background: oklch(0.985 0 0);
    --foreground: oklch(0.145 0 0);
    --card: oklch(1 0 0);
    --card-foreground: oklch(0.145 0 0);
    --popover: oklch(1 0 0);
    --popover-foreground: oklch(0.145 0 0);
    --primary: oklch(0.6 0.15 175);
    --primary-foreground: oklch(1 0 0);
    --secondary: oklch(0.965 0.01 175);
    --secondary-foreground: oklch(0.25 0.05 175);
    --muted: oklch(0.96 0 0);
    --muted-foreground: oklch(0.45 0 0);
    --accent: oklch(0.55 0.12 175);
    --accent-foreground: oklch(1 0 0);
    --destructive: oklch(0.55 0.2 25);
    --destructive-foreground: oklch(1 0 0);
    --border: oklch(0.9 0 0);
    --input: oklch(0.92 0 0);
    --ring: oklch(0.6 0.15 175);
    --chart-1: oklch(0.6 0.15 175);
    --chart-2: oklch(0.65 0.12 220);
    --chart-3: oklch(0.7 0.14 140);
    --chart-4: oklch(0.75 0.1 60);
    --chart-5: oklch(0.55 0.15 280);
    --radius: 0.75rem;
    --sidebar: oklch(0.98 0 0);
    --sidebar-foreground: oklch(0.145 0 0);
    --sidebar-primary: oklch(0.6 0.15 175);
    --sidebar-primary-foreground: oklch(1 0 0);
    --sidebar-accent: oklch(0.965 0.01 175);
    --sidebar-accent-foreground: oklch(0.25 0.05 175);
    --sidebar-border: oklch(0.9 0 0);
    --sidebar-ring: oklch(0.6 0.15 175);

    /* Custom Tetra colors */
    --tetra-teal: oklch(0.6 0.15 175);
    --tetra-teal-light: oklch(0.92 0.04 175);
    --tetra-success: oklch(0.65 0.18 145);
    --tetra-warning: oklch(0.75 0.15 75);
  }

  .dark {
    --background: oklch(0.12 0 0);
    --foreground: oklch(0.95 0 0);
    --card: oklch(0.16 0 0);
    --card-foreground: oklch(0.95 0 0);
    --popover: oklch(0.16 0 0);
    --popover-foreground: oklch(0.95 0 0);
    --primary: oklch(0.65 0.15 175);
    --primary-foreground: oklch(0.1 0 0);
    --secondary: oklch(0.22 0.02 175);
    --secondary-foreground: oklch(0.9 0 0);
    --muted: oklch(0.22 0 0);
    --muted-foreground: oklch(0.65 0 0);
    --accent: oklch(0.65 0.12 175);
    --accent-foreground: oklch(0.1 0 0);
    --destructive: oklch(0.5 0.2 25);
    --destructive-foreground: oklch(0.95 0 0);
    --border: oklch(0.25 0 0);
    --input: oklch(0.25 0 0);
    --ring: oklch(0.65 0.15 175);
    --chart-1: oklch(0.65 0.15 175);
    --chart-2: oklch(0.6 0.12 220);
    --chart-3: oklch(0.65 0.14 140);
    --chart-4: oklch(0.7 0.1 60);
    --chart-5: oklch(0.6 0.15 280);
    --sidebar: oklch(0.14 0 0);
    --sidebar-foreground: oklch(0.95 0 0);
    --sidebar-primary: oklch(0.65 0.15 175);
    --sidebar-primary-foreground: oklch(0.1 0 0);
    --sidebar-accent: oklch(0.22 0.02 175);
    --sidebar-accent-foreground: oklch(0.9 0 0);
    --sidebar-border: oklch(0.25 0 0);
    --sidebar-ring: oklch(0.65 0.15 175);

    --tetra-teal: oklch(0.65 0.15 175);
    --tetra-teal-light: oklch(0.25 0.05 175);
    --tetra-success: oklch(0.6 0.15 145);
    --tetra-warning: oklch(0.7 0.12 75);
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* 
   Tetra Global Utility Classes 
   Kopier disse også hvis du vil ha "glass-panel" og andre effekter
*/

@layer components {
  .nt-card {
    @apply rounded-xl border bg-card text-card-foreground shadow-sm p-6 hover:shadow-md transition-shadow duration-200;
  }
  
  .nt-btn {
    @apply inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 py-2 px-4 shadow h-9;
  }

  .nt-btn-primary {
    @apply bg-primary text-primary-foreground hover:bg-primary/90;
  }

  .nt-input {
     @apply flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm;
  }
}
```

---

Lykke til! 🚀
