# Pedal Diary — Support, Marketing & Privacy site

This folder is a self-contained static website for the Pedal Diary cycling app.
It serves the three URLs that App Store Connect needs:

- **Support URL** → `index.html`
- **Marketing URL** → `marketing.html`
- **Privacy Policy URL** → `privacy.html`

A custom `404.html` and a sticky theme switcher round it out.

---

## Files

| File             | Purpose                                                              |
| ---------------- | -------------------------------------------------------------------- |
| `index.html`     | Support page with FAQ accordions and contact details                 |
| `marketing.html` | Marketing page with features, hero, panels and structured data       |
| `privacy.html`   | Full privacy policy                                                  |
| `404.html`       | Custom not-found page                                                |
| `styles.css`     | All design tokens, 7 themes, animations, responsive rules            |
| `app.js`         | Theme picker (with localStorage persistence) and scroll-reveal       |
| `PQTitle.png`    | The Pedal Diary title logo *(copy this in — see below)*              |

---

## One-time setup: copy the title logo

The HTML expects a file called `PQTitle.png` to live alongside the HTML files.
Copy it across from your existing repo:

```bash
cp /Users/marcoliff/Downloads/pedalquest-support-main/PQTitle.png \
   /Users/marcoliff/Codingapps/PedalGitPages/PQTitle.png
```

Or just drag-and-drop it in Finder.

---

## Deploy to GitHub Pages

Replace the contents of your existing `dusky101/pedalquest-support` repo with
the files in this folder, then push:

```bash
cd /Users/marcoliff/Codingapps/PedalGitPages
git init
git remote add origin https://github.com/dusky101/pedalquest-support.git
git fetch origin
git checkout -b main
git add .
git commit -m "Enhance support, marketing and privacy pages with themed UI"
git push --force-with-lease origin main
```

> The `--force-with-lease` is because the file layout has changed — it
> overwrites the previous version safely. If you would rather preserve the
> existing history, clone the repo into a new folder, copy these files in,
> and commit them as a normal update instead.

GitHub Pages will redeploy automatically within a minute or two. The site will
be live at:

```
https://pedaldiary.iamcoding.uk/
https://pedaldiary.iamcoding.uk/marketing.html
https://pedaldiary.iamcoding.uk/privacy.html
```

Those are the URLs you give App Store Connect.

---

## Local preview

Open any of the HTML files directly in a browser, or run a tiny local server
so paths behave the same way they will on GitHub Pages:

```bash
cd /Users/marcoliff/Codingapps/PedalGitPages
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

---

## What this build adds

### Live theme switcher
Top-right corner of every page. Picks from all 7 of the in-app themes:

- Sky (default, soft blue)
- Sunset (warm orange and pink)
- Forest (greens)
- Underwater (teal with rising bubbles)
- Dinosaur (earthy greens)
- Space (dark with a twinkling starfield)
- Racing Track (red, yellow, racing stripes)

The chosen theme persists across pages via `localStorage["pedalquest-theme"]`.

### Themed decorations
Each theme adds a subtle decorative layer:

- Sky has drifting clouds
- Underwater has bubbles rising from the bottom of the page
- Space has twinkling stars and soft purple nebulae
- Forest has leaf dapples
- Sunset has warm orbs of light
- Racing has chequered diagonal stripes
- Dinosaur has footprint flecks

All decorations are pure CSS — no images required.

### Smooth scroll reveals
Sections fade in as they enter the viewport, using `IntersectionObserver`.
Reduced Motion users see no animation at all (handled at both JS and CSS
level).

### Open Graph and structured data
Each page has `og:` and `twitter:card` metadata so links preview nicely when
shared in iMessage, Slack, X, etc. The marketing page also includes JSON-LD
`SoftwareApplication` schema for search engines.

### Accessibility
- All buttons and the theme picker have proper `aria-*` attributes
- Focus rings are visible and match the active theme
- Reduced Motion strips animation
- Sticky site bar uses `backdrop-filter` but stays readable on every theme
- Dark mode is automatic via the Space theme
- Print stylesheet for the privacy policy

### Performance
- One CSS file, one JS file, both small
- `defer` on the script so it never blocks render
- An inline pre-paint snippet reads the saved theme before first paint so
  there is no flash of the wrong colour scheme
- System fonts only — no web font downloads
- All decorations are CSS gradients, no extra image assets beyond
  `PQTitle.png`

---

## Customising

To change the contact email, search for `marc@iamcoding.uk` and replace it
in all four HTML files.

To change a theme's colours, edit the `body[data-theme="<name>"]` block in
`styles.css`. The CSS custom properties cascade through everything else.

To add a new theme:

1. Copy any existing `body[data-theme="..."]` block in `styles.css`, give it
   a new id and tune the colours.
2. Add the matching entry to the `THEMES` array near the top of `app.js`.
3. Add a matching `.swatch.<id>` rule in the picker section of `styles.css`
   so the picker shows the right preview.
