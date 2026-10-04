// ============================================================================
// 图片上传：按白名单目录落盘，返回可在配置里引用的路径字符串。
// ============================================================================

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { absFromRoot } from "./paths";

const ALLOWED_EXT = [".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".svg"];

interface Destination {
	/** 相对项目根的目录 */
	dir: string;
	/** 返回给配置用的路径前缀（src 图用相对 src 的路径，public 图用 / 开头） */
	prefix: string;
}

const DESTINATIONS: Record<string, Destination> = {
	avatar: { dir: "src/assets/images", prefix: "assets/images" },
	"logo-light": { dir: "src/assets/images/logo", prefix: "assets/images/logo" },
	"logo-dark": { dir: "src/assets/images/logo", prefix: "assets/images/logo" },
	favicon: { dir: "public/favicon", prefix: "/favicon" },
	"wallpaper-desktop": {
		dir: "src/assets/images/DesktopWallpaper",
		prefix: "assets/images/DesktopWallpaper",
	},
	"wallpaper-mobile": {
		dir: "src/assets/images/MobileWallpaper",
		prefix: "assets/images/MobileWallpaper",
	},
};

/** 清洗文件名：去路径、去非法字符、校验扩展名 */
function sanitizeFilename(raw: string): string {
	const base = basename(raw.replace(/\\/g, "/")) || "image";
	const cleaned = base.replace(/[^A-Za-z0-9._-]/g, "-").replace(/^\.+/, "");
	const ext = extname(cleaned).toLowerCase();
	if (!ALLOWED_EXT.includes(ext)) {
		throw new Error(`不支持的文件类型「${ext}」，仅支持 ${ALLOWED_EXT.join(" ")}`);
	}
	return cleaned;
}

/** 若同名文件已存在，自动追加 -1/-2 后缀，避免覆盖用户已有图片 */
function uniqueAbsPath(dir: string, filename: string): string {
	const ext = extname(filename);
	const stem = filename.slice(0, filename.length - ext.length);
	let candidate = resolve(dir, filename);
	let i = 1;
	while (existsSync(candidate)) {
		candidate = resolve(dir, `${stem}-${i}${ext}`);
		i += 1;
	}
	return candidate;
}

export function saveImage(dest: string, filename: string, buffer: Buffer): { path: string } {
	const target = DESTINATIONS[dest];
	if (!target) throw new Error(`未知的图片目标「${dest}」`);
	const name = sanitizeFilename(filename);
	const absDir = absFromRoot(target.dir);
	mkdirSync(absDir, { recursive: true });
	const absFile = uniqueAbsPath(absDir, name);
	writeFileSync(absFile, buffer);
	const writtenName = basename(absFile);
	return { path: `${target.prefix}/${writtenName}`.replace(/\/+/g, (m) => (m === "//" ? "/" : m)) };
}
