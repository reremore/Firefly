// ============================================================================
// 可编辑字段声明（schema 驱动：前端表单、读取快照、AST 补丁都依赖这份声明）
// 后续扩展只需在 fields 里新增一条即可接入编辑器，无需改前端/补丁逻辑。
// ============================================================================

export type FieldType =
	| "text"
	| "textarea"
	| "number"
	| "hue"
	| "toggle"
	| "select"
	| "image"
	| "string-list"
	| "image-list"
	| "link-list";

export interface LinkItemKey {
	key: string;
	label: string;
	type: "text" | "toggle";
}

export interface Field {
	id: string;
	section: string;
	label: string;
	type: FieldType;
	/** 相对项目根的配置文件路径 */
	file: string;
	/**
	 * 对象路径：第一个元素是 `export const <name>` 的变量名，
	 * 其后依次是属性名 / 数组下标（string 表示对象属性，number 表示数组下标）。
	 * 若为空（如 FooterConfig.html），则整文件读写。
	 */
	path?: (string | number)[];
	options?: { label: string; value: string }[];
	/** 图片上传目标目录标识，见 upload.ts 的 DESTINATIONS */
	dest?: string;
	help?: string;
	placeholder?: string;
	/** link-list 列表项的字段结构 */
	itemSchema?: LinkItemKey[];
	/** 服务端专用：把配置里的原始值转成 UI 快照值 */
	decode?: (v: unknown) => unknown;
	/** 服务端专用：把 UI 值转回配置里的原始值 */
	encode?: (v: unknown) => unknown;
}

const LINK_ITEM_SCHEMA: LinkItemKey[] = [
	{ key: "name", label: "名称", type: "text" },
	{ key: "icon", label: "图标", type: "text" },
	{ key: "url", label: "链接", type: "text" },
	{ key: "showName", label: "显示名称", type: "toggle" },
];

const MODE_OPTIONS = [
	{ label: "跟随系统", value: "system" },
	{ label: "亮色", value: "light" },
	{ label: "暗色", value: "dark" },
];

export const fields: Field[] = [
	// ── 配色 ────────────────────────────────────────────────
	{
		id: "theme.hue",
		section: "配色",
		label: "主题色相",
		type: "hue",
		file: "src/config/siteConfig.ts",
		path: ["siteConfig", "themeColor", "hue"],
		help: "0–360 色相，整个网站的主题色由此派生（oklch 色彩空间）。",
	},
	{
		id: "theme.defaultMode",
		section: "配色",
		label: "默认亮暗模式",
		type: "select",
		file: "src/config/siteConfig.ts",
		path: ["siteConfig", "themeColor", "defaultMode"],
		options: MODE_OPTIONS,
	},
	{
		id: "card.border",
		section: "配色",
		label: "卡片边框与阴影",
		type: "toggle",
		file: "src/config/siteConfig.ts",
		path: ["siteConfig", "card", "border"],
		help: "开启后卡片更具立体感。",
	},
	{
		id: "card.followTheme",
		section: "配色",
		label: "卡片跟随主题色",
		type: "toggle",
		file: "src/config/siteConfig.ts",
		path: ["siteConfig", "card", "followTheme"],
	},

	// ── 站点信息 ────────────────────────────────────────────
	{
		id: "site.title",
		section: "站点信息",
		label: "站点标题",
		type: "text",
		file: "src/config/siteConfig.ts",
		path: ["siteConfig", "title"],
	},
	{
		id: "site.subtitle",
		section: "站点信息",
		label: "站点副标题",
		type: "text",
		file: "src/config/siteConfig.ts",
		path: ["siteConfig", "subtitle"],
	},
	{
		id: "site.description",
		section: "站点信息",
		label: "站点描述",
		type: "textarea",
		file: "src/config/siteConfig.ts",
		path: ["siteConfig", "description"],
		help: "用于生成 <meta name=\"description\">，影响 SEO。",
	},
	{
		id: "site.keywords",
		section: "站点信息",
		label: "站点关键词",
		type: "string-list",
		file: "src/config/siteConfig.ts",
		path: ["siteConfig", "keywords"],
	},
	{
		id: "site.navbarTitle",
		section: "站点信息",
		label: "导航栏标题",
		type: "text",
		file: "src/config/siteConfig.ts",
		path: ["siteConfig", "navbar", "title"],
	},

	// ── 个人资料 ────────────────────────────────────────────
	{
		id: "profile.avatar",
		section: "个人资料",
		label: "头像",
		type: "image",
		file: "src/config/profileConfig.ts",
		path: ["profileConfig", "avatar"],
		dest: "avatar",
	},
	{
		id: "profile.name",
		section: "个人资料",
		label: "名字",
		type: "text",
		file: "src/config/profileConfig.ts",
		path: ["profileConfig", "name"],
	},
	{
		id: "profile.bio",
		section: "个人资料",
		label: "个人签名",
		type: "text",
		file: "src/config/profileConfig.ts",
		path: ["profileConfig", "bio"],
	},
	{
		id: "profile.links",
		section: "个人资料",
		label: "社交链接",
		type: "link-list",
		file: "src/config/profileConfig.ts",
		path: ["profileConfig", "links"],
		itemSchema: LINK_ITEM_SCHEMA,
	},

	// ── 图片 ────────────────────────────────────────────────
	{
		id: "logo.light",
		section: "图片",
		label: "Logo（亮色）",
		type: "image",
		file: "src/config/siteConfig.ts",
		path: ["siteConfig", "navbar", "logo", "value"],
		dest: "logo-light",
	},
	{
		id: "logo.dark",
		section: "图片",
		label: "Logo（暗色）",
		type: "image",
		file: "src/config/siteConfig.ts",
		path: ["siteConfig", "navbar", "logo", "valueDark"],
		dest: "logo-dark",
	},
	{
		id: "site.favicon",
		section: "图片",
		label: "网站图标（Favicon）",
		type: "image",
		file: "src/config/siteConfig.ts",
		// 只替换 favicon 数组第一个元素的 src，保留数组内注释与注释掉的 theme/sizes 示例
		path: ["siteConfig", "favicon", 0, "src"],
		dest: "favicon",
	},
	{
		id: "wallpaper.desktop",
		section: "图片",
		label: "桌面壁纸",
		type: "image-list",
		file: "src/config/backgroundWallpaper.ts",
		path: ["backgroundWallpaper", "src", "desktop"],
		dest: "wallpaper-desktop",
		help: "每次刷新随机显示一张。",
	},
	{
		id: "wallpaper.mobile",
		section: "图片",
		label: "移动壁纸",
		type: "image-list",
		file: "src/config/backgroundWallpaper.ts",
		path: ["backgroundWallpaper", "src", "mobile"],
		dest: "wallpaper-mobile",
	},
	{
		id: "wallpaper.playerUrl",
		section: "图片",
		label: "背景视频地址",
		type: "text",
		file: "src/config/backgroundWallpaper.ts",
		path: ["backgroundWallpaper", "src", "playerUrl"],
		help: "支持本地路径（放 public/assets/videos/ 下）或远程 URL。",
	},

	// ── 首页横幅 ────────────────────────────────────────────
	{
		id: "banner.home.enable",
		section: "首页横幅",
		label: "显示横幅文字",
		type: "toggle",
		file: "src/config/backgroundWallpaper.ts",
		path: ["backgroundWallpaper", "common", "homeText", "enable"],
	},
	{
		id: "banner.home.title",
		section: "首页横幅",
		label: "横幅主标题",
		type: "text",
		file: "src/config/backgroundWallpaper.ts",
		path: ["backgroundWallpaper", "common", "homeText", "title"],
	},
	{
		id: "banner.home.subtitle",
		section: "首页横幅",
		label: "横幅副标题（可多行）",
		type: "string-list",
		file: "src/config/backgroundWallpaper.ts",
		path: ["backgroundWallpaper", "common", "homeText", "subtitle"],
		help: "开启打字机效果时循环显示，否则每次刷新随机显示一条。",
	},
	{
		id: "banner.typewriter.enable",
		section: "首页横幅",
		label: "打字机效果",
		type: "toggle",
		file: "src/config/backgroundWallpaper.ts",
		path: ["backgroundWallpaper", "common", "homeText", "typewriter", "enable"],
	},
	{
		id: "banner.home.links",
		section: "首页横幅",
		label: "横幅链接图标",
		type: "link-list",
		file: "src/config/backgroundWallpaper.ts",
		path: ["backgroundWallpaper", "common", "homeText", "links"],
		itemSchema: LINK_ITEM_SCHEMA,
	},

	// ── 公告 ────────────────────────────────────────────────
	{
		id: "announcement.title",
		section: "公告",
		label: "公告标题",
		type: "text",
		file: "src/config/announcementConfig.ts",
		path: ["announcementConfig", "title"],
		placeholder: "留空则使用默认标题",
	},
	{
		id: "announcement.content",
		section: "公告",
		label: "公告内容",
		type: "textarea",
		file: "src/config/announcementConfig.ts",
		path: ["announcementConfig", "content"],
	},
	{
		id: "announcement.closable",
		section: "公告",
		label: "允许用户关闭",
		type: "toggle",
		file: "src/config/announcementConfig.ts",
		path: ["announcementConfig", "closable"],
	},
	{
		id: "announcement.link.enable",
		section: "公告",
		label: "显示链接",
		type: "toggle",
		file: "src/config/announcementConfig.ts",
		path: ["announcementConfig", "link", "enable"],
	},
	{
		id: "announcement.link.text",
		section: "公告",
		label: "链接文字",
		type: "text",
		file: "src/config/announcementConfig.ts",
		path: ["announcementConfig", "link", "text"],
	},
	{
		id: "announcement.link.url",
		section: "公告",
		label: "链接地址",
		type: "text",
		file: "src/config/announcementConfig.ts",
		path: ["announcementConfig", "link", "url"],
	},
	{
		id: "announcement.link.external",
		section: "公告",
		label: "新窗口打开",
		type: "toggle",
		file: "src/config/announcementConfig.ts",
		path: ["announcementConfig", "link", "external"],
	},

	// ── 页脚 ────────────────────────────────────────────────
	{
		id: "footer.html",
		section: "页脚",
		label: "页脚 HTML",
		type: "textarea",
		file: "src/config/FooterConfig.html",
		help: "直接用 HTML 自定义网站底部页脚内容。",
	},
];
