<div align="center">

# 青空 (Aozora)

> A personal blog built on the [Firefly](https://github.com/CuteLeaf/Firefly) theme — a clean, modern Astro static site

> ![Node.js >= 22](https://img.shields.io/badge/node.js-%3E%3D22-brightgreen)
![pnpm >= 9](https://img.shields.io/badge/pnpm-%3E%3D9-blue)
![Astro](https://img.shields.io/badge/Astro-7-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-6-blue)

> ![GitHub License](https://img.shields.io/github/license/reremore/Firefly)

</div>

---

📖 README：**[简体中文](README.md)** | **[English](README.en.md)**

This is my ([reremore](https://github.com/reremore)) personal blog, built on the **Firefly** theme. Firefly is a clean, modern personal-blog theme built on the Astro framework and the Fuwari template, combining a modern web stack with a rich feature set and a highly customizable interface.

On top of Firefly, this project ships an additional **visual configuration editor** (`pnpm admin`), so you can tweak colors, images, and text content without touching any code.

- ⚡ **Static generation**: built on Astro — fast to load, SEO friendly
- 🎨 **Modern design**: clean and elegant, with 360° theme-color customization
- 📱 **Mobile friendly**: polished responsive experience, mobile-first optimizations
- 🔧 **Highly configurable**: most feature modules are customizable via config files
- 🖱️ **Visual editing**: built-in GUI to change colors / images / text without hand-editing code

<table width="100%" align="center">
  <tr>
    <td colspan="3" align="center">
      <img src="./docs/images/1.webp" >
      <br>Banner mode</td>
    </td>
  </tr>
  <tr>
    <td align="center"><img src="./docs/images/3.webp" width="300"><br>Overlay mode</td>
    <td align="center"><img src="./docs/images/2.webp" width="300"><br>Full-screen wallpaper mode</td>
    <td align="center"><img src="./docs/images/4.webp" width="300"><br>Solid color mode</td>
  </tr>
</table>

## ✨ Features

### Core

- [x] **Astro + Tailwind CSS** - super-fast static site generation on a modern stack
- [x] **Smooth animations** - Swup page transitions for a silky browsing experience
- [x] **Responsive design** - optimized for desktop, tablet and mobile
- [x] **i18n** - UI supports Simplified Chinese, Traditional Chinese, English, Japanese, Russian and Korean
- [x] **Full-text search** - client-side search powered by Pagefind, with content indexing

### Personalization

- [x] **Visual configuration editor** - `pnpm admin` GUI to change colors, images and text
- [x] **Dynamic sidebar** - single-sidebar or dual-sidebar layout
- [x] **Post layouts** - list (single column) or grid (multi-column / masonry)
- [x] **Font management** - custom fonts with a rich font picker
- [x] **Footer configuration** - HTML content injection, fully customizable
- [x] **Light / dark mode** - light, dark, or follow-system
- [x] **Navbar customization** - logo, title and links fully customizable
- [x] **Wallpaper modes** - banner wallpaper, full-screen wallpaper, overlay wallpaper, solid color
- [x] **Theme color** - 360° hue adjustment

## 🎨 Visual Configuration Editor

Besides editing the config files under `src/config/` directly, this blog ships a **visual configuration editor** so you can change colors, images and text without touching code:

```bash
pnpm admin
```

Then open `http://localhost:5199` in your browser. It supports:

- **Colors**: theme hue, default light/dark mode, card style
- **Images**: avatar, logo, favicon, desktop / mobile wallpaper (with upload)
- **Text**: site title, subtitle, description, keywords, announcement, footer HTML, home banner text, and more

Changes are written back to the config files via the TypeScript compiler API, **preserving all existing comments**. Run `pnpm dev` in another terminal to preview the result live.

## 🚀 Getting Started

### Requirements

- Node.js ≥ 22
- pnpm ≥ 9

### Local development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/reremore/Firefly.git
   cd Firefly
   ```

2. **Install dependencies:**
   ```bash
   # Install pnpm first if you don't have it
   npm install -g pnpm

   # Install project dependencies
   pnpm install
   ```

3. **Configure the blog:**
   - Edit the config files under `src/config/` directly, or run `pnpm admin` to use the visual editor

4. **Start the dev server:**
   ```bash
   pnpm dev
   ```
   The blog will be available at `http://localhost:4321`

### Deployment

See the [Astro deployment guide](https://docs.astro.build/en/guides/deploy/) to deploy to Vercel, Netlify, Cloudflare Pages, EdgeOne Pages, and more.

- Framework preset: `Astro`
- Root directory: `./`
- Output directory: `dist`
- Build command: `pnpm run build`
- Install command: `pnpm install`

## 📖 Configuration

> 📚 See the [configuration guide](./src/config/README.md) for the full list of config files

### Setting the site language

Edit `src/config/siteConfig.ts`:

```typescript
// Define the site language
const SITE_LANG = "zh_CN";
```

**Supported language codes:** `zh_CN` (Simplified Chinese), `zh_TW` (Traditional Chinese), `en` (English), `ja` (Japanese), `ru` (Russian), `ko` (Korean)

### Config file structure

```
src/
├── config/
│   ├── index.ts                  # Config index
│   ├── siteConfig.ts             # Basic site configuration
│   ├── analyticsConfig.ts        # Analytics configuration
│   ├── announcementConfig.ts     # Announcement configuration
│   ├── backgroundWallpaper.ts    # Background wallpaper configuration
│   ├── commentConfig.ts          # Comment system configuration
│   ├── coverImageConfig.ts       # Cover image configuration
│   ├── displaySettingsConfig.ts  # Display settings panel configuration
│   ├── dynamicConfig.ts          # Moments page configuration
│   ├── effectsConfig.ts          # Effects configuration (sakura, etc.)
│   ├── expressiveCodeConfig.ts   # Code highlighting configuration
│   ├── fontConfig.ts             # Font configuration
│   ├── FooterConfig.html         # Footer configuration
│   ├── friendsConfig.ts          # Friend links configuration
│   ├── galleryConfig.ts          # Gallery configuration
│   ├── licenseConfig.ts          # License configuration
│   ├── musicConfig.ts            # Music player configuration
│   ├── navBarConfig.ts           # Navbar configuration
│   ├── pioConfig.ts              # Pio (mascot) configuration
│   ├── mermaidConfig.ts          # Mermaid diagram configuration
│   ├── plantumlConfig.ts         # PlantUML diagram configuration
│   ├── profileConfig.ts          # Profile configuration
│   └── sidebarConfig.ts          # Sidebar layout configuration
```

## ⚙️ Post Frontmatter

```yaml
---
title: My First Blog Post
published: 2023-09-09
description: This is the first post of my new Astro blog.
image: ./cover.jpg  # or use "api" to enable a random cover image
tags: [Foo, Bar]
category: Front-end
draft: false
lang: zh-CN      # only needed when the post language differs from the site language in siteConfig.ts
pinned: false    # pin to top
comment: true    # allow comments
---
```

## Moments

Moment files live in `src/content/dynamic/` — one Markdown file per moment. Create one quickly with:

```bash
pnpm new-d Feeling great today, had hotpot with friends
```

`pnpm new-dynamic <content>` is equivalent to `new-d`.

```yaml
---
published: 2026-07-15 16:15:29
pinned: true  # pin to top
location: China # location
---

Moment content supports Markdown syntax.
```

[Memos](https://www.usememos.com/) is also supported as a data source — configure the `memos` option in `src/config/dynamicConfig.ts` to fetch moments in real time, with pinned sync and image attachment support.

## 🧩 Markdown Extensions

In addition to the [GitHub Flavored Markdown](https://github.github.com/gfm/) supported by Astro by default, several extra Markdown features are included:

- Admonitions — GitHub, Obsidian, VitePress and Docusaurus style themes
- GitHub repository cards
- Enhanced code blocks powered by Expressive Code

## 🧞 Commands

All commands are run from the root of the project:

| Command                       | Action                                        |
| :---------------------------- | :-------------------------------------------- |
| `pnpm install`                | Install dependencies                          |
| `pnpm dev`                    | Start the dev server at `localhost:4321`      |
| `pnpm admin`                  | Start the visual config editor at `localhost:5199` |
| `pnpm build`                  | Build the site to `./dist/`                   |
| `pnpm preview`                | Preview the built site locally                |
| `pnpm check`                  | Check the code for errors                     |
| `pnpm format`                 | Format the code with Biome                    |
| `pnpm new-post <filename>`    | Create a new post                             |
| `pnpm new-d <content>`        | Create a moment                               |
| `pnpm new-dynamic <content>`  | Create a moment (full command)                |
| `pnpm astro ...`              | Run commands such as `astro add`, `astro check` |
| `pnpm astro --help`           | Show the Astro CLI help                       |

## 🙏 Acknowledgements

Many thanks to [saicaca](https://github.com/saicaca) for the [fuwari](https://github.com/saicaca/fuwari) template, and to [CuteLeaf](https://github.com/CuteLeaf) for the [Firefly](https://github.com/CuteLeaf/Firefly) theme, on which this project is built.

Some Firefly-related image assets are copyrighted by miHoYo, the developer of [Honkai: Star Rail](https://sr.mihoyo.com/).

### Tech Stack

- [Astro](https://astro.build)
- [Tailwind CSS](https://tailwindcss.com)
- [Iconify](https://iconify.design)

### Inspirations

- [fuwari](https://github.com/saicaca/fuwari)
- [hexo-theme-shoka](https://github.com/amehime/hexo-theme-shoka)
- [astro-koharu](https://github.com/cosZone/astro-koharu)
- [Mizuki](https://github.com/matsuzaka-yuki/Mizuki)

## 📝 License

This project is licensed under the [MIT license](https://mit-license.org/). See the [LICENSE](./LICENSE) file for details.

**Copyright notice:**

- Copyright (c) 2024 [saicaca](https://github.com/saicaca) - [fuwari](https://github.com/saicaca/fuwari)
- Copyright (c) 2025 [CuteLeaf](https://github.com/CuteLeaf) - [Firefly](https://github.com/CuteLeaf/Firefly)

Under the MIT license you are free to use, modify and distribute the code, but you must retain the copyright notices above.
