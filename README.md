<div align="center">

# 青空

> 基于 [Firefly](https://github.com/CuteLeaf/Firefly) 主题的个人博客 —— 清新美观的 Astro 静态站点

> ![Node.js >= 22](https://img.shields.io/badge/node.js-%3E%3D22-brightgreen)
![pnpm >= 9](https://img.shields.io/badge/pnpm-%3E%3D9-blue)
![Astro](https://img.shields.io/badge/Astro-7-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-6-blue)

> ![GitHub License](https://img.shields.io/github/license/reremore/Firefly)

</div>

---

📖 README：**[简体中文](README.md)** | **[English](README.en.md)**

这是我（[reremore](https://github.com/reremore)）的个人博客，基于 **Firefly** 主题构建。Firefly 是一款基于 Astro 框架和 Fuwari 模板开发的清新美观、现代化个人博客主题，融合了现代 Web 技术栈，提供丰富的功能模块和高度可定制的界面。

本项目在 Firefly 的基础上，额外内置了一个**可视化配置编辑器**（`pnpm admin`），无需懂代码即可方便地修改配色、图片与文字内容。

- ⚡ **静态站点生成**：基于 Astro，加载快、SEO 友好
- 🎨 **现代化设计**：简洁美观，支持 360° 主题色自定义
- 📱 **移动友好**：完善的响应式体验，移动端专项优化
- 🔧 **高度可配置**：大部分功能模块均可通过配置文件自定义
- 🖱️ **可视化编辑**：内置图形界面，改配色 / 图片 / 文案不必手改代码

<table width="100%" align="center">
  <tr>
    <td colspan="3" align="center">
      <img src="./docs/images/1.webp" >
      <br>横幅模式</td>
    </td>
  </tr>
  <tr>
    <td align="center"><img src="./docs/images/3.webp" width="300"><br>透明覆盖模式</td>
    <td align="center"><img src="./docs/images/2.webp" width="300"><br>全屏壁纸模式</td>
    <td align="center"><img src="./docs/images/4.webp" width="300"><br>纯色模式</td>
  </tr>
</table>

## ✨ 功能特性

### 核心功能

- [x] **Astro + Tailwind CSS** - 基于现代技术栈的超快静态站点生成
- [x] **流畅动画** - Swup 页面过渡动画，提供丝滑的浏览体验
- [x] **响应式设计** - 完美适配桌面端、平板和移动设备
- [x] **多语言支持** - i18n 国际化，UI 支持简体中文、繁体中文、英文、日文、俄语、韩文
- [x] **全文搜索** - 基于 Pagefind 的客户端搜索，支持文章内容索引

### 个性化

- [x] **可视化配置编辑器** - `pnpm admin` 图形界面改配色、图片与文案
- [x] **动态侧边栏** - 支持配置单侧边栏、双侧边栏
- [x] **文章布局** - 支持(单列)列表、网格(多列/瀑布流)布局
- [x] **字体管理** - 支持自定义字体，丰富的字体选择器
- [x] **页脚配置** - HTML 内容注入，完全自定义
- [x] **亮暗色模式** - 支持亮色/暗色/跟随系统三种模式
- [x] **导航栏自定义** - Logo、标题、链接全面自定义
- [x] **壁纸模式切换** - 横幅壁纸、全屏壁纸、透明覆盖壁纸、纯色背景
- [x] **主题色自定义** - 360° 色相调节

## 🎨 可视化配置编辑器

除了直接编辑 `src/config/` 下的配置文件，本博客还内置了一个**可视化配置编辑器**，无需懂代码即可修改配色、图片与文字内容：

```bash
pnpm admin
```

然后在浏览器打开 `http://localhost:5199`。它支持：

- **配色**：主题色相、默认亮暗模式、卡片样式
- **图片**：头像、Logo、网站图标、桌面 / 移动壁纸（支持上传）
- **文字内容**：站点标题、副标题、描述、关键词、公告、页脚 HTML、首页横幅文案等

改动会通过 TypeScript 编译器 API 精准写回配置文件，**原有注释全部保留**。可另开终端运行 `pnpm dev` 实时预览效果。

## 🚀 快速开始

### 环境要求

- Node.js ≥ 22
- pnpm ≥ 9

### 本地开发

1. **克隆仓库：**
   ```bash
   git clone https://github.com/reremore/Firefly.git
   cd Firefly
   ```

2. **安装依赖：**
   ```bash
   # 如果没有安装 pnpm，先安装
   npm install -g pnpm

   # 安装项目依赖
   pnpm install
   ```

3. **配置博客：**
   - 直接编辑 `src/config/` 目录下的配置文件，或运行 `pnpm admin` 使用可视化编辑器

4. **启动开发服务器：**
   ```bash
   pnpm dev
   ```
   博客将在 `http://localhost:4321` 可用

### 平台托管部署

参考 [Astro 官方部署指南](https://docs.astro.build/zh-cn/guides/deploy/)，可将博客部署至 Vercel、Netlify、Cloudflare Pages、EdgeOne Pages 等平台。

- 框架预设：`Astro`
- 根目录：`./`
- 输出目录：`dist`
- 构建命令：`pnpm run build`
- 安装命令：`pnpm install`

## 📖 配置说明

> 📚 详细配置可参考 [Firefly 使用文档](https://docs-firefly.cuteleaf.cn/) 获取完整指南

### 设置网站语言

编辑 `src/config/siteConfig.ts`：

```typescript
// 定义站点语言
const SITE_LANG = "zh_CN";
```

**支持的语言代码：** `zh_CN`（简体中文）、`zh_TW`（繁体中文）、`en`（英文）、`ja`（日文）、`ru`（俄文）、`ko`（韩文）

### 配置文件结构

```
src/
├── config/
│   ├── index.ts                  # 配置索引文件
│   ├── siteConfig.ts             # 站点基础配置
│   ├── analyticsConfig.ts        # 统计分析配置
│   ├── announcementConfig.ts     # 公告配置
│   ├── backgroundWallpaper.ts    # 背景壁纸配置
│   ├── commentConfig.ts          # 评论系统配置
│   ├── coverImageConfig.ts       # 封面图配置
│   ├── displaySettingsConfig.ts  # 设置面板配置
│   ├── dynamicConfig.ts          # 动态页面配置
│   ├── effectsConfig.ts          # 动画特效配置（樱花等）
│   ├── expressiveCodeConfig.ts   # 代码高亮配置
│   ├── fontConfig.ts             # 字体配置
│   ├── FooterConfig.html         # 页脚配置
│   ├── friendsConfig.ts          # 友链配置
│   ├── galleryConfig.ts          # 相册配置
│   ├── licenseConfig.ts          # 许可证配置
│   ├── musicConfig.ts            # 音乐播放器配置
│   ├── navBarConfig.ts           # 导航栏配置
│   ├── pioConfig.ts              # 看板娘配置
│   ├── mermaidConfig.ts          # Mermaid 图表配置
│   ├── plantumlConfig.ts         # PlantUML 图表配置
│   ├── profileConfig.ts          # 用户资料配置
│   ├── sidebarConfig.ts          # 侧边栏布局配置
│   └── sponsorConfig.ts          # 打赏配置
```

## ⚙️ 文章 Frontmatter

```yaml
---
title: My First Blog Post
published: 2023-09-09
description: This is the first post of my new Astro blog.
image: ./cover.jpg  # 或使用 "api" 来启用随机封面图
tags: [Foo, Bar]
category: Front-end
draft: false
lang: zh-CN      # 仅当文章语言与 `siteConfig.ts` 中的网站语言不同时需要设置
pinned: false    # 置顶
comment: true    # 是否允许评论
---
```

## 动态

动态文件保存在 `src/content/dynamic/` 中，一个 Markdown 文件对应一条动态。可以使用快捷命令创建：

```bash
pnpm new-d 今天心情不错，出去吃了一顿火锅
```

`pnpm new-dynamic <content>` 也可以使用，和 `new-d` 完全等价。

```yaml
---
published: 2026-07-15 16:15:29
pinned: true  # 置顶
location: China # 位置
---

动态内容可以使用 Markdown 语法。
```

也支持对接 [Memos](https://www.usememos.com/) 作为数据源，在 `src/config/dynamicConfig.ts` 中配置 `memos` 选项即可实时获取 Memos 动态，支持置顶同步和图片附件展示。

## 🧩 Markdown 扩展语法

除了 Astro 默认支持的 [GitHub Flavored Markdown](https://github.github.com/gfm/) 之外，还包含了一些额外的 Markdown 功能：

- 提醒块（Admonitions） - 支持 GitHub、Obsidian、VitePress、Docusaurus 四种风格主题配置
- GitHub 仓库卡片
- 基于 Expressive Code 的增强代码块

## 🧞 指令

下列指令均需要在项目根目录执行：

| Command                       | Action                                 |
| :---------------------------- | :------------------------------------- |
| `pnpm install`                | 安装依赖                               |
| `pnpm dev`                    | 在 `localhost:4321` 启动本地开发服务器 |
| `pnpm admin`                  | 在 `localhost:5199` 启动可视化配置编辑器 |
| `pnpm build`                  | 构建网站至 `./dist/`                   |
| `pnpm preview`                | 本地预览已构建的网站                   |
| `pnpm check`                  | 检查代码中的错误                       |
| `pnpm format`                 | 使用 Biome 格式化代码                  |
| `pnpm new-post <filename>`    | 创建新文章                             |
| `pnpm new-d <content>`        | 创建一条动态                           |
| `pnpm new-dynamic <content>`  | 创建一条动态（完整命令）               |
| `pnpm astro ...`              | 执行 `astro add`, `astro check` 等指令 |
| `pnpm astro --help`           | 显示 Astro CLI 帮助                    |

## 🙏 致谢

非常感谢 [saicaca](https://github.com/saicaca) 开发的 [fuwari](https://github.com/saicaca/fuwari) 模板，以及 [CuteLeaf](https://github.com/CuteLeaf) 开发的 [Firefly](https://github.com/CuteLeaf/Firefly) 主题，本项目基于它们构建。

流萤部分相关图片素材版权归游戏 [《崩坏：星穹铁道》](https://sr.mihoyo.com/) 开发商 [米哈游](https://www.mihoyo.com/) 所有。

### 技术栈

- [Astro](https://astro.build)
- [Tailwind CSS](https://tailwindcss.com)
- [Iconify](https://iconify.design)

### 灵感项目

- [fuwari](https://github.com/saicaca/fuwari)
- [hexo-theme-shoka](https://github.com/amehime/hexo-theme-shoka)
- [astro-koharu](https://github.com/cosZone/astro-koharu)
- [Mizuki](https://github.com/matsuzaka-yuki/Mizuki)

## 📝 许可协议

本项目遵循 [MIT license](https://mit-license.org/) 开源协议，详细查看 [LICENSE](./LICENSE) 文件。

**版权声明：**

- Copyright (c) 2024 [saicaca](https://github.com/saicaca) - [fuwari](https://github.com/saicaca/fuwari)
- Copyright (c) 2025 [CuteLeaf](https://github.com/CuteLeaf) - [Firefly](https://github.com/CuteLeaf/Firefly)

根据 MIT 开源协议，你可以自由使用、修改、分发代码，但需保留上述版权声明。
