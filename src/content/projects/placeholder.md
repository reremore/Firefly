---
title: "占位项目（请替换或删除）"
slug: placeholder
published: 2026-10-04
draft: true
order: 0
description: "这是一个占位文件，用来让 src/content/projects/ 不为空。写自己的项目时把它删掉即可。"
image: ""
status: "planning"
tags: []
---

## 怎么添加一个项目

在 `src/content/projects/` 下新建一个 `.md` 或 `.mdx` 文件即可。**正文就是项目 README**，渲染在详情页底部；**frontmatter** 里的字段用于列表卡片和详情页顶部。

## Frontmatter 字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `title` | string | 必填。项目名称。 |
| `slug` | string | 可选。URL 别名，不填则用文件名。 |
| `published` | date | 必填。发布/更新日期，如 `2026-10-04`。 |
| `draft` | boolean | 可选，默认 `false`。设为 `true` 时生产构建会隐藏该页，开发环境仍可见。 |
| `order` | number | 可选。排序权重，**越大越靠前**；未设置则按 `published` 降序。 |
| `description` | string | 可选。卡片简介 + 详情页描述。 |
| `image` | string | 可选。封面图，支持完整 URL、`/images/xxx.png`（public）或相对路径 `images/xxx.png`。 |
| `tags` | string[] | 可选。标签，显示为 `#标签`。 |
| `link` | array | 可选。外链按钮数组：`{ label, icon, value }`。 |
| `status` | string | 可选。项目状态，取值为 `planning` / `developing` / `published` / `archived`。 |
| `lang` | string | 可选。页面语言，如 `zh_CN`。 |

## 示例

```yaml
---
title: "我的项目"
slug: my-project
published: 2026-10-04
status: "developing"
tags:
  - Astro
link:
  - label: "GitHub"
    icon: "fa7-brands:github"
    value: "https://github.com/你的用户名/仓库名"
---
```
