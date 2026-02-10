# Wildman Brand Style Guide

> Version 1.0 — A unified design system for all Wildman applications

---

## Table of Contents

1. [Brand Identity](#brand-identity)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components](#components)
6. [Icons & Imagery](#icons--imagery)
7. [Animation & Motion](#animation--motion)
8. [Accessibility](#accessibility)
9. [Implementation](#implementation)

---

## Brand Identity

### Brand Personality

**Wildman** embodies a rugged, natural, and honest approach to digital experiences. The brand aesthetic draws inspiration from earthy tones, minimal design, and functional simplicity.

**Core Values:**
- **Honest & Straightforward** — No unnecessary complexity
- **Natural & Organic** — Earth-inspired color palette
- **Functional** — Form follows function
- **Accessible** — Works for everyone, everywhere
- **Modern Minimalism** — Clean, contemporary design with purpose

**Voice & Tone:**
- Direct and clear
- Helpful without being condescending
- Professional but approachable
- Confident and reliable

---

## Color Palette

### Dark Mode (Default)

```css
--bg: #161514              /* Primary background - deep charcoal */
--bg-raised: #1e1d1b       /* Elevated surfaces - lighter charcoal */
--text: #ccc8c0            /* Primary text - warm light gray */
--text-dim: #7a756d        /* Secondary text - muted gray */
--border: #2a2824          /* Borders & dividers - subtle brown-gray */
--accent: #c2664e          /* Primary accent - terracotta */
--accent-hover: #d47560    /* Accent hover state - lighter terracotta */
--paid: #5a9a6a            /* Success/positive - sage green */
--overdue: #c44040         /* Error/critical - rust red */
--due-soon: #c49040        /* Warning/caution - amber */
```

### Light Mode

```css
--bg: #f6f3ee              /* Primary background - warm off-white */
--bg-raised: #ffffff       /* Elevated surfaces - pure white */
--text: #2a2520            /* Primary text - dark brown */
--text-dim: #7a756d        /* Secondary text - muted gray */
--border: #ddd8d0          /* Borders & dividers - light brown-gray */
--accent: #b85a42          /* Primary accent - darker terracotta */
--accent-hover: #a34c36    /* Accent hover state - deep terracotta */
--paid: #4a8a5a            /* Success/positive - darker sage */
--overdue: #b83a3a         /* Error/critical - darker rust red */
--due-soon: #b88030        /* Warning/caution - darker amber */
```

### Color Usage Guidelines

**Backgrounds:**
- Use `--bg` for main app background
- Use `--bg-raised` for cards, modals, elevated surfaces
- Never use pure black (#000) or pure white (#fff) for backgrounds

**Text:**
- Use `--text` for primary content
- Use `--text-dim` for labels, metadata, secondary information
- Ensure 4.5:1 contrast ratio minimum

**Accent Colors:**
- `--accent` is the primary brand color — use sparingly for CTAs, active states, emphasis
- `--paid` (green) for positive actions, success states, income
- `--overdue` (red) for errors, critical alerts, destructive actions
- `--due-soon` (amber) for warnings, upcoming items, cautions

**Borders:**
- Use `--border` for all dividing lines, input borders, container outlines
- Keep borders subtle — 1px width maximum

---

## Typography

### Font Stack

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

**Why this stack:**
- Native system fonts for performance
- Consistent with platform conventions
- Excellent readability across devices
- Zero font loading time

### Font Sizes

```css
/* Base */
--font-base: 1rem;           /* 16px - body text */

/* Headings */
--font-h1: 1.5rem;           /* 24px - page titles */
--font-h2: 1.05rem;          /* 17px - section headers */
--font-h3: 1rem;             /* 16px - subsections */

/* UI Elements */
--font-large: 1.25rem;       /* 20px - prominent values */
--font-medium: 0.95rem;      /* 15px - standard UI text */
--font-small: 0.9rem;        /* 14px - buttons, inputs */
--font-tiny: 0.75rem;        /* 12px - labels, metadata */
--font-micro: 0.7rem;        /* 11px - fine print */
```

### Font Weights

```css
--weight-normal: 400;        /* Body text */
--weight-medium: 500;        /* Emphasized text */
--weight-semibold: 600;      /* Headings, important UI */
--weight-bold: 700;          /* Strong emphasis */
--weight-heavy: 800;         /* Charts, data visualization */
```

### Line Height

```css
--line-height-tight: 1.3;    /* Headings, compact lists */
--line-height-base: 1.5;     /* Body text, default */
--line-height-loose: 1.7;    /* Long-form content */
```

### Typography Rules

1. **Use rem units** for all font sizes to respect user preferences
2. **Base font size** is 16px (1rem)
3. **Line height** should be 1.5 for body text
4. **Enable font smoothing** on dark backgrounds:
   ```css
   -webkit-font-smoothing: antialiased;
   -moz-osx-font-smoothing: grayscale;
   ```
5. **Never use font sizes smaller than 0.7rem** (11px) for readability
6. **Use font weight** to create hierarchy, not just size

---

## Spacing & Layout

### Spacing Scale

Use a consistent 4px/0.25rem base unit:

```css
--space-xs: 0.25rem;    /* 4px - minimal gaps */
--space-sm: 0.5rem;     /* 8px - tight spacing */
--space-md: 0.75rem;    /* 12px - default gaps */
--space-lg: 1rem;       /* 16px - comfortable spacing */
--space-xl: 1.5rem;     /* 24px - section spacing */
--space-2xl: 2rem;      /* 32px - major sections */
--space-3xl: 3rem;      /* 48px - page-level spacing */
```

### Layout Constraints

```css
/* Mobile-first */
--container-mobile: 100%;
--container-padding: 1rem;

/* Tablet & Desktop */
--container-small: 640px;    /* Default max-width */
--container-medium: 720px;   /* Desktop max-width */
--container-large: 960px;    /* Wide layouts */

/* Breakpoints */
--breakpoint-tablet: 769px;
--breakpoint-desktop: 1024px;
```

### Grid & Alignment

- **Max width:** 640px mobile, 720px desktop (centered)
- **Padding:** Minimum 1rem on all sides
- **Safe areas:** Account for device notches and home indicators
  ```css
  padding-left: max(1rem, env(safe-area-inset-left));
  padding-right: max(1rem, env(safe-area-inset-right));
  padding-bottom: calc(68px + env(safe-area-inset-bottom) + 1rem);
  ```

---

## Components

### Border Radius

```css
--radius-sm: 4px;      /* Small elements, tags */
--radius-md: 6px;      /* Buttons, inputs, default */
--radius-lg: 8px;      /* Cards, containers */
--radius-xl: 10px;     /* Modals, large cards */
--radius-2xl: 14px;    /* Featured cards, charts */
--radius-full: 50%;    /* Circular elements */
```

### Buttons

**Primary Button:**
```css
background: var(--accent);
color: #fff;
border: none;
padding: 0.5rem 1.25rem;
border-radius: 6px;
font-size: 0.9rem;
font-weight: 500;
min-height: 44px;
transition: background 0.15s;
```

**Secondary Button:**
```css
background: var(--bg-raised);
color: var(--text);
border: 1px solid var(--border);
padding: 0.5rem 1rem;
border-radius: 6px;
font-size: 0.9rem;
font-weight: 500;
min-height: 44px;
transition: border-color 0.15s;
```

**Icon Button:**
```css
background: none;
border: none;
color: var(--text-dim);
padding: 0.25rem;
min-width: 36px;
min-height: 36px;
border-radius: 6px;
transition: color 0.15s;
```

**Touch Targets:**
- Minimum **44px x 44px** for all interactive elements (WCAG 2.1 AAA)
- Adequate spacing between touch targets

### Forms

**Input Fields:**
```css
width: 100%;
padding: 0.55rem 0.65rem;
border: 1px solid var(--border);
border-radius: 6px;
background: var(--bg);
color: var(--text);
font-size: 0.9rem;
min-height: 44px;
transition: border-color 0.15s;
```

**Focus State:**
```css
outline: none;
border-color: var(--accent);
```

**Placeholder:**
```css
color: var(--text-dim);
```

### Cards

**Standard Card:**
```css
background: var(--bg-raised);
border: 1px solid var(--border);
border-radius: 8px;
padding: 1rem;
```

**Featured Card (Charts, Hero):**
```css
background: var(--bg-raised);
border: 1px solid var(--border);
border-radius: 14px;
padding: 1.15rem 1rem 1rem;
box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.18),
    0 2px 6px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
transition: box-shadow 0.2s;
```

### Modals

```css
/* Overlay */
background: rgba(0, 0, 0, 0.5);

/* Modal Content */
background: var(--bg-raised);
padding: 1.5rem;
border-radius: 10px;
max-width: 420px;
width: 90%;
border: 1px solid var(--border);
```

### Lists & Tables

**List Item:**
```css
padding: 0.65rem 0;
border-bottom: 1px solid var(--border);
```

**Table Cell:**
```css
padding: 0.6rem 0.5rem;
font-size: 0.9rem;
border-bottom: 1px solid var(--border);
```

### Navigation

**Bottom Navigation Bar:**
```css
position: fixed;
bottom: 0;
background: var(--bg-raised);
border-top: 1px solid var(--border);
padding-bottom: env(safe-area-inset-bottom);
height: 56px;
```

**Nav Item:**
```css
color: var(--text-dim);
font-size: 0.6rem;
min-height: 44px;
transition: color 0.15s;
```

**Active State:**
```css
color: var(--accent);
```

---

## Icons & Imagery

### Icon System

- **Primary:** Font Awesome (included via `fa.min.css`)
- **Size:** 1.1rem for nav icons, 0.85-1.15rem for inline icons
- **Color:** Inherit from parent or use `--text-dim` by default

### Icon Usage

```css
/* Navigation icons */
font-size: 1.1rem;

/* Inline icons */
font-size: 0.85rem;

/* Button icons */
font-size: 0.85rem;

/* Large action icons */
font-size: 1.15rem;
```

### Logo & Branding

- **Logo height:** 40px mobile, 56px desktop
- **Placement:** Top-left in header
- **Spacing:** Auto margin-right to push nav items right

---

## Animation & Motion

### Transition Timing

```css
--transition-fast: 0.15s;     /* Hover, active states */
--transition-base: 0.2s;      /* Standard transitions */
--transition-slow: 0.3s;      /* Complex animations */
```

### Easing

```css
/* Default easing - use for all transitions */
transition-timing-function: ease;
```

### Motion Guidelines

1. **Keep it subtle** — animations should enhance, not distract
2. **Use consistent timing** — 0.15s for most interactions
3. **Transition properties:**
   - `color` for text/icon color changes
   - `background` for button/card background changes
   - `border-color` for input focus states
   - `opacity` for show/hide states
4. **Avoid animating:**
   - Layout properties (width, height, margin, padding)
   - Transform if not necessary
5. **Respect user preferences:**
   ```css
   @media (prefers-reduced-motion: reduce) {
       * {
           animation-duration: 0.01ms !important;
           transition-duration: 0.01ms !important;
       }
   }
   ```

---

## Accessibility

### Core Principles

1. **Color Contrast:**
   - Text/background: Minimum 4.5:1 (WCAG AA)
   - Large text: Minimum 3:1
   - UI components: Minimum 3:1

2. **Touch Targets:**
   - Minimum 44px x 44px (WCAG 2.1 AAA)
   - Adequate spacing between targets

3. **Keyboard Navigation:**
   - All interactive elements focusable
   - Focus indicators visible
   - Logical tab order

4. **Focus States:**
   ```css
   outline: none;
   border-color: var(--accent);
   /* Or use custom focus ring */
   box-shadow: 0 0 0 3px rgba(194, 102, 78, 0.3);
   ```

5. **Screen Readers:**
   - Use semantic HTML
   - Provide ARIA labels where needed
   - Ensure meaningful alt text for images

6. **Mobile Considerations:**
   - Disable tap highlight: `-webkit-tap-highlight-color: transparent;`
   - Prevent text size adjust: `-webkit-text-size-adjust: 100%;`
   - Support safe areas for notched devices

---

## Implementation

### CSS Custom Properties Setup

```css
:root {
    /* Default to dark mode */
    --bg: #161514;
    --bg-raised: #1e1d1b;
    --text: #ccc8c0;
    --text-dim: #7a756d;
    --border: #2a2824;
    --accent: #c2664e;
    --accent-hover: #d47560;
    --paid: #5a9a6a;
    --overdue: #c44040;
    --due-soon: #c49040;
}

/* Light mode override */
html[data-theme='light'] {
    --bg: #f6f3ee;
    --bg-raised: #ffffff;
    --text: #2a2520;
    --text-dim: #7a756d;
    --border: #ddd8d0;
    --accent: #b85a42;
    --accent-hover: #a34c36;
    --paid: #4a8a5a;
    --overdue: #b83a3a;
    --due-soon: #b88030;
}

/* Respect system preference */
@media (prefers-color-scheme: light) {
    :root:not([data-theme]) {
        --bg: #f6f3ee;
        --bg-raised: #ffffff;
        --text: #2a2520;
        --text-dim: #7a756d;
        --border: #ddd8d0;
        --accent: #b85a42;
        --accent-hover: #a34c36;
        --paid: #4a8a5a;
        --overdue: #b83a3a;
        --due-soon: #b88030;
    }
}
```

### Base Styles

```css
*, *::before, *::after {
    box-sizing: border-box;
}

body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.5;
    -webkit-text-size-adjust: 100%;
    -webkit-tap-highlight-color: transparent;
    -webkit-font-smoothing: antialiased;
}
```

### Container Pattern

```css
.container {
    max-width: 640px;
    margin: 0 auto;
    padding: 0 1rem 5rem;
    padding-left: max(1rem, env(safe-area-inset-left));
    padding-right: max(1rem, env(safe-area-inset-right));
    padding-bottom: calc(68px + env(safe-area-inset-bottom) + 1rem);
}

@media (min-width: 769px) {
    .container {
        max-width: 720px;
        padding-bottom: 2rem;
    }
}
```

### Theme Switching

```javascript
// Toggle theme
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

// Initialize theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
}
```

---

## Design Checklist

When creating a new Wildman application, ensure:

- [ ] CSS custom properties implemented for all colors
- [ ] System font stack used
- [ ] Dark and light modes supported
- [ ] Color contrast meets WCAG AA (4.5:1 minimum)
- [ ] All interactive elements are 44px minimum
- [ ] Border radius consistent (6px default, 14px featured)
- [ ] Transitions use 0.15s timing
- [ ] Safe area insets respected on mobile
- [ ] Reduced motion preference respected
- [ ] Focus states visible and accessible
- [ ] Typography scale uses rem units
- [ ] Spacing follows 4px base unit
- [ ] Maximum container width: 640px mobile, 720px desktop

---

## Quick Reference

### Most-Used Values

```css
/* Colors */
--accent: #c2664e (dark) / #b85a42 (light)
--bg: #161514 (dark) / #f6f3ee (light)

/* Spacing */
gap: 0.5rem;
padding: 0.5rem 1rem;
margin-bottom: 1.5rem;

/* Typography */
font-size: 0.9rem;
font-weight: 500;
line-height: 1.5;

/* Borders */
border-radius: 6px;
border: 1px solid var(--border);

/* Transitions */
transition: all 0.15s;

/* Touch Targets */
min-height: 44px;
min-width: 44px;
```

---

## Version History

- **v1.0** (2026-02-10) — Initial Wildman brand guide based on Budget PWA design system

---

**Wildman Brand Guide** — Consistent, accessible, and beautiful design across all applications.
