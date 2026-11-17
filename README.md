# Rehearse website

Marketing site for [Rehearse](https://apps.apple.com/app/id6761712673), served at [letsrehearse.studio](https://letsrehearse.studio).

Built with [Astro](https://astro.build). Pages are static HTML. The only JavaScript is the playable piano demo, the mobile menu, page prefetching and the support page's copy button, about 4 KB gzipped in total. Images are resized to AVIF/WebP at build time and fonts are self-hosted.

## Commands

Requires Node 22.23.4 or later.

| Command           | What it does                                  |
| ----------------- | --------------------------------------------- |
| `npm install`     | Install dependencies                          |
| `npm run dev`     | Start the dev server at http://localhost:4321 |
| `npm run build`   | Build the site into `dist/`                   |
| `npm run preview` | Serve the built site locally                  |
| `npm run check`   | Type-check the project                        |

## Where things are

```
src/
  pages/        One file per URL (index, support, privacy-policy, terms-of-service, 404)
  layouts/      Page shells: Base (nav + footer) and Legal (long-form pages)
  components/   Nav, Footer, Phone frame, App Store badge, PianoDemo
  assets/       App screenshots, crops and fonts (optimized at build time)
  data/site.ts  App Store link, support email and other shared facts
public/         Files copied as-is: CNAME, favicons, badge, og.jpg, robots.txt
```

To update screenshots, replace the files in `src/assets/screens/` and keep the same names. Astro regenerates every size on the next build.

## Deploying

`.github/workflows/deploy.yml` builds and publishes the site to GitHub Pages on every push to `main`.

One-time setup: in the repository on GitHub, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
