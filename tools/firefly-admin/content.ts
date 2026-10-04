// ============================================================================
// 内容读写：文章（posts）与动态（dynamic）的 Markdown + frontmatter 增删改查。
//
// frontmatter 用 gray-matter 解析，但必须搭配 js-yaml 的 CORE_SCHEMA：
// 默认 schema 会把 `published: 2026-10-04` 解析成 Date 对象，回写时变成
// `2026-10-04T00:00:00.000Z`，破坏原始格式；CORE_SCHEMA 下日期保持字符串，
// 往返无损（`published: 2026-07-15 16:15:29` 原样保留）。
// ============================================================================

import {
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	statSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import matter from "gray-matter";
import yaml from "js-yaml";
import { pinyin } from "pinyin-pro";
import { absFromRoot } from "./paths";

export type ContentType = "post" | "dynamic";

/** 内容类型 → 相对项目根的目录 */
const DIRS: Record<ContentType, string> = {
	post: "src/content/posts",
	dynamic: "src/content/dynamic",
};

/** 内容类型 → 允许的文件扩展名 */
const ALLOWED_EXT: Record<ContentType, string[]> = {
	post: [".md", ".mdx"],
	dynamic: [".md"],
};

// ── frontmatter 解析 ────────────────────────────────────────

/** js-yaml 引擎：CORE_SCHEMA 让日期保持为字符串（而非 Date 对象） */
const yamlEngine = {
	parse: (s: string) => yaml.load(s, { schema: yaml.CORE_SCHEMA }),
	stringify: (o: unknown) => yaml.dump(o, { schema: yaml.CORE_SCHEMA, lineWidth: -1 }),
};

function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
	const parsed = matter(raw, { engines: { yaml: yamlEngine } });
	return { data: parsed.data as Record<string, unknown>, content: parsed.content };
}

function stringifyFrontmatter(data: Record<string, unknown>, content: string): string {
	const pruned: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(data)) {
		if (v !== undefined) pruned[k] = v;
	}
	// 与主题既有文件保持一致：frontmatter 与正文之间保留一个空行
	const body = content && !content.startsWith("\n") ? `\n${content}` : content;
	return matter.stringify(body, pruned, { engines: { yaml: yamlEngine } });
}

// ── 路径校验 ────────────────────────────────────────────────

function dirAbs(type: ContentType): string {
	return absFromRoot(DIRS[type]);
}

/** 把相对 DIRS 的文件路径解析为绝对路径，并阻止目录穿越 */
function resolveContentPath(type: ContentType, file: string): string {
	const dir = resolve(dirAbs(type));
	const abs = resolve(dir, file);
	if (abs !== dir && !abs.startsWith(dir + "\\") && !abs.startsWith(dir + "/")) {
		throw new Error("非法的文件路径");
	}
	return abs;
}

/** 清洗用户提供的相对路径：去首斜杠、拒绝 .. 与空段、校验扩展名 */
function normalizeRel(type: ContentType, file: string): string {
	const cleaned = file.replace(/\\/g, "/").replace(/^\/+/, "");
	const segments = cleaned.split("/");
	if (segments.some((seg) => seg === ".." || seg === "")) {
		throw new Error("非法的文件名");
	}
	const ext = extname(cleaned).toLowerCase();
	if (!ALLOWED_EXT[type].includes(ext)) {
		throw new Error(`不支持的文件类型「${ext || "（无扩展名）"}」`);
	}
	return cleaned;
}

// ── 辅助 ────────────────────────────────────────────────────

function str(v: unknown): string {
	if (typeof v === "string") return v;
	return v === null || v === undefined ? "" : String(v);
}

/** 从正文里取一行作为列表标题的兜底显示 */
function firstLine(content: string): string {
	const line = content.split("\n").find((l) => l.trim());
	return (line || "")
		.replace(/^#+\s*/, "")
		.replace(/[>*_`]/g, "")
		.trim()
		.slice(0, 60);
}

/** 递归收集指定扩展名的文件（绝对路径） */
function walk(dir: string, exts: string[]): string[] {
	const out: string[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const abs = join(dir, entry.name);
		if (entry.isDirectory()) out.push(...walk(abs, exts));
		else if (entry.isFile() && exts.includes(extname(entry.name).toLowerCase())) out.push(abs);
	}
	return out;
}

/** 中文标题转拼音 slug，与 scripts/new-post.js 的命名约定一致 */
function slugify(input: string): string {
	const trimmed = input.trim();
	if (!trimmed) return "";
	let converted: string;
	try {
		// nonZh: "consecutive" 让连续的英文/数字保持整体（galgame 而非 g-a-l-g-a-m-e）
		converted = pinyin(trimmed, {
			toneType: "none",
			type: "array",
			nonZh: "consecutive",
		}).join("-");
	} catch {
		converted = trimmed;
	}
	return converted
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 80);
}

/** 站点时区（用于动态文件名的时间戳），读取失败则回退 Asia/Shanghai */
let tzCache: string | null = null;
async function siteTimezone(): Promise<string> {
	if (tzCache) return tzCache;
	try {
		const url = `${pathToFileURL(absFromRoot("src/config/siteConfig.ts")).href}?t=${Date.now()}`;
		const mod = (await import(url)) as { siteConfig?: { timezone?: string } };
		tzCache = mod.siteConfig?.timezone || "";
	} catch {
		tzCache = "";
	}
	return tzCache || "Asia/Shanghai";
}

/** 按站点时区生成 YYYY-MM-DD-HHMMSS 文件名串 */
async function dynamicStamp(): Promise<string> {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: await siteTimezone(),
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hourCycle: "h23",
	})
		.formatToParts(new Date())
		.reduce<Record<string, string>>((acc, part) => {
			if (part.type !== "literal") acc[part.type] = part.value;
			return acc;
		}, {});
	const date = `${parts.year}-${parts.month}-${parts.day}`;
	const time = `${parts.hour}${parts.minute}${parts.second}`;
	return `${date}-${time}`;
}

// ── 公开 API ────────────────────────────────────────────────

export interface ContentListItem {
	/** 相对 DIRS 的路径（含扩展名），作为条目标识 */
	file: string;
	slug: string;
	title: string;
	published: string;
	draft: boolean;
	category: string;
	tags: string[];
	mtime: number;
}

export function listContent(type: ContentType): ContentListItem[] {
	const dir = dirAbs(type);
	if (!existsSync(dir)) return [];
	const items = walk(dir, ALLOWED_EXT[type]).map((abs) => {
		const { data, content } = parseFrontmatter(readFileSync(abs, "utf8"));
		const file = relative(dir, abs).replace(/\\/g, "/");
		return {
			file,
			slug: file.replace(/\.(md|mdx)$/i, ""),
			title: str(data.title) || firstLine(content) || file,
			published: str(data.published),
			draft: data.draft === true,
			category: str(data.category),
			tags: Array.isArray(data.tags) ? data.tags.map((t) => String(t)) : [],
			mtime: statSync(abs).mtimeMs,
		};
	});
	items.sort(
		(a, b) => b.published.localeCompare(a.published) || b.mtime - a.mtime,
	);
	return items;
}

export interface ContentDoc {
	file: string;
	data: Record<string, unknown>;
	content: string;
}

export function readContent(type: ContentType, file: string): ContentDoc {
	const abs = resolveContentPath(type, file);
	if (!existsSync(abs)) throw new Error("文件不存在");
	const { data, content } = parseFrontmatter(readFileSync(abs, "utf8"));
	return {
		file: relative(dirAbs(type), abs).replace(/\\/g, "/"),
		data,
		content,
	};
}

export async function saveContent(
	type: ContentType,
	file: string | undefined,
	data: Record<string, unknown>,
	content: string,
): Promise<{ file: string }> {
	const dir = dirAbs(type);
	mkdirSync(dir, { recursive: true });

	let rel: string;
	if (file && file.trim()) {
		// 更新已有条目：保持文件名不变（文件名决定文章 URL）
		rel = normalizeRel(type, file.trim());
	} else if (type === "dynamic") {
		rel = normalizeRel(type, `${await dynamicStamp()}.md`);
	} else {
		const slug = slugify(str(data.title)) || `new-post-${Date.now()}`;
		rel = normalizeRel(type, `${slug}.md`);
	}

	const abs = resolveContentPath(type, rel);
	writeFileSync(abs, stringifyFrontmatter(data, content), "utf8");
	return { file: rel };
}

export function deleteContent(type: ContentType, file: string): void {
	const abs = resolveContentPath(type, file);
	if (!existsSync(abs)) throw new Error("文件不存在");
	unlinkSync(abs);
}

export function isContentType(value: string): value is ContentType {
	return value === "post" || value === "dynamic";
}
