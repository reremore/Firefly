// ============================================================================
// Firefly 配置编辑器 —— 本地 HTTP 服务（pnpm admin）
// 零新增依赖：node:http + tsx + typescript。
// ============================================================================

import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer, get as httpGet, type IncomingMessage, type ServerResponse } from "node:http";
import { extname, resolve } from "node:path";
import { fields } from "./schema";
import { readSnapshot } from "./read-config";
import { patchProperty, patchWholeFile } from "./patch-config";
import {
	deleteContent,
	isContentType,
	listContent,
	readContent,
	saveContent,
} from "./content";
import { saveImage } from "./upload";
import { absFromRoot, projectRoot } from "./paths";

const PORT = Number(process.env.ADMIN_PORT || process.argv[2] || 5199);
const PREVIEW_URL = "http://localhost:4321";

const MIME: Record<string, string> = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
	".avif": "image/avif",
	".gif": "image/gif",
	".svg": "image/svg+xml",
};

function sendJson(res: ServerResponse, status: number, body: unknown): void {
	const data = JSON.stringify(body);
	res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
	res.end(data);
}

function sendBuffer(res: ServerResponse, status: number, data: Buffer, type: string): void {
	res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
	res.end(data);
}

function readBody(req: IncomingMessage, limit = 8 * 1024 * 1024): Promise<Buffer> {
	return new Promise((resolvePromise, reject) => {
		const chunks: Buffer[] = [];
		let size = 0;
		req.on("data", (c: Buffer) => {
			size += c.length;
			if (size > limit) {
				reject(new Error("请求体过大"));
				req.destroy();
				return;
			}
			chunks.push(c);
		});
		req.on("end", () => resolvePromise(Buffer.concat(chunks)));
		req.on("error", reject);
	});
}

function servePublicFile(res: ServerResponse, relPath: string): boolean {
	const safe = relPath.replace(/\\/g, "/").replace(/^\/+/, "").split("/").filter(Boolean).join("/");
	if (!safe) return false;
	const abs = resolve(projectRoot, "tools/firefly-admin/public", safe);
	if (!abs.startsWith(resolve(projectRoot, "tools/firefly-admin/public"))) return false;
	if (!existsSync(abs) || !statSync(abs).isFile()) return false;
	sendBuffer(res, 200, readFileSync(abs), MIME[extname(abs).toLowerCase()] || "application/octet-stream");
	return true;
}

/** 通过 config 里的图片路径返回文件内容（src 相对路径 / public 绝对路径） */
function serveMedia(res: ServerResponse, configPath: string): boolean {
	const rel = configPath.replace(/\\/g, "/").replace(/^\/+/, "");
	if (rel.includes("..") || !rel) return false;
	let abs: string;
	let base: string;
	if (configPath.startsWith("/")) {
		abs = resolve(projectRoot, "public", rel);
		base = resolve(projectRoot, "public");
	} else {
		abs = resolve(projectRoot, "src", rel);
		base = resolve(projectRoot, "src");
	}
	if (!abs.startsWith(base + "\\") && !abs.startsWith(base + "/")) return false;
	if (!existsSync(abs) || !statSync(abs).isFile()) return false;
	sendBuffer(res, 200, readFileSync(abs), MIME[extname(abs).toLowerCase()] || "application/octet-stream");
	return true;
}

function checkPreview(): Promise<boolean> {
	return new Promise((resolvePromise) => {
		const req = httpGet(PREVIEW_URL, (r) => {
			resolvePromise(r.statusCode !== undefined && r.statusCode < 500);
			r.resume();
		});
		req.setTimeout(800, () => {
			req.destroy();
			resolvePromise(false);
		});
		req.on("error", () => resolvePromise(false));
	});
}

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
	const url = new URL(req.url || "/", `http://localhost:${PORT}`);
	const pathname = url.pathname;

	try {
		// ── 静态页面 / 资源 ──────────────────────────────
		if (req.method === "GET" && (pathname === "/" || pathname === "/index.html")) {
			return servePublicFile(res, "index.html");
		}
		if (req.method === "GET" && /^\/[\w.-]+\.(js|css)$/.test(pathname)) {
			return servePublicFile(res, pathname.slice(1));
		}

		// ── API：字段声明 ────────────────────────────────
		if (req.method === "GET" && pathname === "/api/schema") {
			return sendJson(res, 200, { fields });
		}

		// ── API：读取当前配置 ────────────────────────────
		if (req.method === "GET" && pathname === "/api/config") {
			const snapshot = await readSnapshot(fields);
			return sendJson(res, 200, snapshot);
		}

		// ── API：保存配置 ────────────────────────────────
		if (req.method === "POST" && pathname === "/api/config") {
			const body = await readBody(req);
			let payload: Record<string, unknown>;
			try {
				payload = JSON.parse(body.toString("utf8"));
			} catch {
				return sendJson(res, 400, { ok: false, error: "请求体不是合法 JSON" });
			}
			const changed: string[] = [];
			for (const field of fields) {
				if (!(field.id in payload)) continue;
				const value = field.encode ? field.encode(payload[field.id]) : payload[field.id];
				const absFile = absFromRoot(field.file);
				if (field.path && field.path.length > 0) {
					patchProperty(absFile, field.path, value);
				} else {
					patchWholeFile(absFile, String(value));
				}
				changed.push(field.file);
			}
			return sendJson(res, 200, { ok: true, changed: [...new Set(changed)] });
		}

		// ── API：内容（文章 / 动态）列表 ──────────────────
		if (req.method === "GET" && pathname === "/api/content/list") {
			const type = url.searchParams.get("type") || "";
			if (!isContentType(type)) {
				return sendJson(res, 400, { ok: false, error: "type 必须为 post 或 dynamic" });
			}
			return sendJson(res, 200, { ok: true, items: listContent(type) });
		}

		// ── API：读取单篇内容 ────────────────────────────
		if (req.method === "GET" && pathname === "/api/content/item") {
			const type = url.searchParams.get("type") || "";
			const file = url.searchParams.get("file") || "";
			if (!isContentType(type)) {
				return sendJson(res, 400, { ok: false, error: "type 必须为 post 或 dynamic" });
			}
			try {
				return sendJson(res, 200, { ok: true, ...readContent(type, file) });
			} catch (e) {
				return sendJson(res, 400, { ok: false, error: (e as Error).message });
			}
		}

		// ── API：保存内容（新建 / 更新） ──────────────────
		if (req.method === "POST" && pathname === "/api/content/save") {
			const body = await readBody(req);
			let payload: {
				type?: string;
				file?: string;
				data?: Record<string, unknown>;
				content?: string;
			};
			try {
				payload = JSON.parse(body.toString("utf8"));
			} catch {
				return sendJson(res, 400, { ok: false, error: "请求体不是合法 JSON" });
			}
			if (!isContentType(payload.type || "")) {
				return sendJson(res, 400, { ok: false, error: "type 必须为 post 或 dynamic" });
			}
			try {
				const result = await saveContent(
					payload.type as "post" | "dynamic",
					payload.file,
					payload.data || {},
					payload.content || "",
				);
				return sendJson(res, 200, { ok: true, ...result });
			} catch (e) {
				return sendJson(res, 400, { ok: false, error: (e as Error).message });
			}
		}

		// ── API：删除内容 ────────────────────────────────
		if (req.method === "POST" && pathname === "/api/content/delete") {
			const body = await readBody(req);
			let payload: { type?: string; file?: string };
			try {
				payload = JSON.parse(body.toString("utf8"));
			} catch {
				return sendJson(res, 400, { ok: false, error: "请求体不是合法 JSON" });
			}
			if (!isContentType(payload.type || "")) {
				return sendJson(res, 400, { ok: false, error: "type 必须为 post 或 dynamic" });
			}
			try {
				deleteContent(payload.type as "post" | "dynamic", payload.file || "");
				return sendJson(res, 200, { ok: true });
			} catch (e) {
				return sendJson(res, 400, { ok: false, error: (e as Error).message });
			}
		}

		// ── API：上传图片 ────────────────────────────────
		if (req.method === "POST" && pathname === "/api/upload") {
			const dest = url.searchParams.get("dest") || "";
			const filename = decodeURIComponent(url.searchParams.get("filename") || "image.png");
			const buffer = await readBody(req, 30 * 1024 * 1024);
			try {
				const result = saveImage(dest, filename, buffer);
				return sendJson(res, 200, { ok: true, ...result });
			} catch (e) {
				return sendJson(res, 400, { ok: false, error: (e as Error).message });
			}
		}

		// ── API：图片预览 ────────────────────────────────
		if (req.method === "GET" && pathname === "/media") {
			const p = url.searchParams.get("path") || "";
			if (serveMedia(res, p)) return;
			return sendJson(res, 404, { ok: false, error: "图片不存在" });
		}

		// ── API：预览服务状态 ────────────────────────────
		if (req.method === "GET" && pathname === "/api/preview-status") {
			const running = await checkPreview();
			return sendJson(res, 200, { running, url: PREVIEW_URL });
		}

		return sendJson(res, 404, { ok: false, error: "Not Found" });
	} catch (e) {
		return sendJson(res, 500, { ok: false, error: (e as Error).message });
	}
}

const server = createServer((req, res) => {
	void handle(req, res);
});

server.listen(PORT, () => {
	console.log("");
	console.log("  🔥 Firefly 配置编辑器已启动");
	console.log(`  ➜  打开  http://localhost:${PORT}`);
	console.log(`  ➜  预览  ${PREVIEW_URL}（需另开终端运行 pnpm dev）`);
	console.log("");
});
