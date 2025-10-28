# CSS audit: `index.html`

Date: 2025-10-27

## Summary

- Main stylesheet: `style/style.css`. Bootstrap 4 is also loaded via CDN.
- Typography: multiple Google fonts are included (Karla, Spectral, Rakkas, Playfair Display, Space Grotesk). The stylesheet attempts to use 'Space Grotesk' for the page but the selector is `.body` (bug) instead of `body` so the body font rule doesn't apply.
- Layout:
  - A centered column uses `.section_content { width: 70%; margin: 0 auto; }` (fixed percentage layout without a max-width).
  - `.top-header` uses large paddings (5rem) and a 70px heading.
- Images/videos: `figure { width: 80% }` and `img, video { width: 100%; }` so images fill the figure; many `<img>` tags in the HTML lack explicit `alt` attributes (accessibility note).
- Colors & links:
  - Links are globally `a { color: red; }` which can conflict with Bootstrap and may cause contrast issues.
  - Navbar and footer use red/black but the footer has conflicting color declarations (black background, then `color: red`).
- Media queries:
  - Several breakpoints adjust `.banner-image` at 1024px, 768px, 480px, and a small-mobile 500px rule modifies `.top-header` and `.navbar.scrolled`.
- Misc issues:
  - Duplicate/unused rules: `.body` (typo), duplicated media query for max-width:480px, unused `.navbar-scroll` selector (script toggles `.scrolled` on `.navbar`).
  - Hard-coded values and no CSS variables.

## Noted pain points

- Typography selector bug (`.body` vs `body`) — means the intended base font may not apply.
- Very wide content on large screens due to `width: 70%` without max-width — harms readability.
- Global link color and navbar overrides risk breaking Bootstrap behavior and causing accessibility contrast failures.
- Figure/image sizing is functional but could be clearer and more efficient (responsive images, lazy-loading).
- Lack of centralized design tokens (colors, spacing) makes theme changes error-prone.

## Suggestions (6 total — original 3 plus 3 more)

### 1) Fix selector bugs and remove conflicting rules

Why: Silent selector mistakes make rules ineffective and lead to confusing override behavior.

What to change (small, low-risk edits):

Replace the wrong selector `.body` with `body`, remove duplicate media blocks and unify the navbar scrolled rule.

Example CSS:

```css
/* apply base font correctly */
body {
  font-family: 'Space Grotesk', sans-serif;
}

/* Use the class the script toggles */
.navbar.scrolled {
  background-color: rgba(0,0,0,0.85);
  transition: background-color 0.5s;
}

footer {
  background-color: #000;
  color: #fff; /* single authoritative color for footer text */
  font-weight: 500;
  padding: 2rem;
}
```

Benefit: Predictable styling and fewer accidental overrides.

---

### 2) Make the main column responsive with a max-width (use Bootstrap container or a max-width)

Why: `width: 70%` can produce very long line lengths on large screens and cramped layouts on small ones.

What to change: use a responsive container with `max-width` and side padding, or use Bootstrap's `.container` / `.container-lg`.

Example CSS:

```css
.section_content {
  width: 100%;
  max-width: 980px; /* readable column width */
  margin: 0 auto;
  padding: 0 1rem; /* breathing room on mobile */
}

@media (max-width: 600px) {
  .top-header { padding: 2rem 1rem; }
  .top-header h1 { font-size: 36px; }
}
```

Benefit: Better reading line-lengths and a more consistent experience across viewports.

---

### 3) Centralize colors and theme tokens with CSS variables; avoid global tag overrides

Why: `a { color: red }` and hard-coded hexes make theming and accessibility fixes tedious. Variables make changes safe and atomic.

What to change: add `:root` color variables and scope link color where appropriate.

Example:

```css
:root {
  --brand: #c1121f;    /* brand red */
  --muted: #888888;
  --bg-footer: #000;
  --text-footer: #fff;
}

/* Scoped link color */
.section a, .post a {
  color: var(--brand);
}

footer { background: var(--bg-footer); color: var(--text-footer); }
```

Benefit: safer color changes and easier accessibility testing.

---

### 4) (New) Optimize font loading and reduce font weight/requests

Why: The page loads many font families from Google (Karla, Spectral, Rakkas, Playfair Display, Space Grotesk). Each family increases page weight and latency. Also missing `font-display` can cause FOIT (flash of invisible text).

What to change:

- Reduce the number of families to the essentials (e.g., one serif + one sans + decorative for logo if needed).
- Add `display=swap` to the Google Fonts request (or use `font-display: swap` via `@font-face` if self-hosting).
- Preload the most-important font file(s) for faster rendering of above-the-fold text.

Example (use fewer families and swap):

```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk&family=Spectral:wght@500&display=swap" rel="stylesheet">
<link rel="preload" href="https://fonts.gstatic.com/s/spacegrotesk...woff2" as="font" type="font/woff2" crossorigin>
```

Benefit: Faster initial render, fewer font downloads, improved perceived performance.

---

### 5) (New) Use responsive images (srcset/sizes) and lazy-loading

Why: Many images are large and used at different sizes throughout the site. Serving an appropriately sized image reduces bandwidth and improves load times.

What to change:

- Replace simple `<img src="...">` with `srcset` and `sizes` for responsive delivery.
- Add `loading="lazy"` for below-the-fold images (native lazy-loading).

Example HTML:

```html
<figure>
  <img
    src="/images/bermutto-800.jpg"
    srcset="/images/bermutto-400.jpg 400w, /images/bermutto-800.jpg 800w, /images/bermutto-1600.jpg 1600w"
    sizes="(max-width: 600px) 100vw, (max-width: 1200px) 60vw, 980px"
    loading="lazy"
    alt="Description of image">
  <figcaption>Image by Adam Timur Aslan</figcaption>
</figure>
```

Benefit: Faster page loads and lower data usage for mobile users.

---

### 6) (New) Add a small CSS reset/box-sizing and basic accessibility focus styles

Why: Browser defaults vary; adding `box-sizing` and basic resets improves layout predictability. Focus styles are essential for keyboard users but currently not explicit.

What to change: add a minimal reset at top of `style.css` and define `:focus` outlines.

Example CSS:

```css
/* minimal reset */
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }

/* accessible focus styles */
:focus {
  outline: 3px solid rgba(66,133,244,0.9); /* visible and high contrast */
  outline-offset: 2px;
}
```

Benefit: More predictable layout and improved keyboard navigation/accessibility.

---

## Next steps / Implementation options

- I can implement low-risk fixes now (selector bug, footer, `body`, and `.section_content` max-width). This is quick and reversible.
- Or I can implement the fuller set (CSS variables, font optimizations, responsive images). That requires editing `index.html` and `style/style.css` and optionally adding optimized image assets or `srcset` variants.

Tell me which set you want me to apply (quick fixes vs. full improvements) and I will update the files and run a quick verification.

---

File created from an audit of `index.html` and `style/style.css` in this repo.
