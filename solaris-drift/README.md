# Solaris Drift — NTW Markets-inspired Website Concept

A browser-ready frontend prototype for the proposed continuous cosmic background direction. This is an independent design concept, not the official NTW Markets website. All quotes, prices, account tiers, feature descriptions and calls to action in this prototype are illustrative placeholders and must be replaced/verified before any production use.

## Files
- `index.html` — semantic page structure and sample content
- `assets/css/style.css` — responsive styles, cosmic atmosphere and motion
- `assets/js/main.js` — starfield canvas, mobile menu, scroll reveals and motion controls

## Preview
Open `index.html` directly in a modern desktop or mobile browser. No build tools, package installation, external fonts, images or JavaScript libraries are required.

For a local HTTP preview (recommended), run this from the extracted folder:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Performance choices
- Canvas star count is density-limited and reduced on small/low-power devices.
- Device pixel ratio is capped at 1.5.
- Starfield redraw is capped around 30fps and stops when the page is hidden or motion is paused.
- CSS background movement uses transforms; no external 3D library or web-font dependency.
- Mobile has fewer particles and no star cross-flare rendering.
- `prefers-reduced-motion` is respected.
- A user-facing Pause motion control is included.

## Before production
Replace the illustrative prices, account information, links and copy with approved data; verify all legal disclosures and broker claims; test on target browsers/devices; and compare the final motion against the reference site in a real browser.


## Solaris Drift V2: Immersive cosmic motion
The fixed universe now combines animated nebula washes, layered orbital rings, two decorative planets, soft plasma bands, scroll-linked camera drift, depth-sensitive star movement, dust, and occasional meteors. Motion uses a single Canvas 2D layer capped around 24–31 fps depending on device class, with lower particle counts and pixel ratio on small screens. It also respects `prefers-reduced-motion` and the on-page Pause motion control. The HTML preview is standalone; the main project keeps CSS and JavaScript separate.
