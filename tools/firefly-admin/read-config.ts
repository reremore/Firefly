// ============================================================================
// 读取配置：动态 import 各配置 TS 模块（tsx 会即时转译），
// 用带时间戳的查询串绕过 Node 的 ESM 模块缓存，每次都能读到磁盘上的最新值。
// ============================================================================

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import type { Field } from "./schema";
import { absFromRoot } from "./paths";

/** 带缓存破坏的动态 import，返回模块命名空间 */
async function importFresh(absFile: string): Promise<Record<string, unknown>> {
	const url = `${pathToFileURL(absFile).href}?t=${Date.now()}-${Math.random().toString(36).slice(2)}`;
	return (await import(url)) as Record<string, unknown>;
}

function getByPath(obj: unknown, path: (string | number)[]): unknown {
	let cur = obj as Record<string | number, unknown> | undefined;
	for (const seg of path) {
		if (cur === null || cur === undefined) return undefined;
		cur = cur[seg] as Record<string | number, unknown> | undefined;
	}
	return cur;
}

/** 读取所有字段的当前值，返回 fieldId → UI 快照值 的扁平对象 */
export async function readSnapshot(fields: Field[]): Promise<Record<string, unknown>> {
	const moduleCache = new Map<string, Record<string, unknown>>();
	const snapshot: Record<string, unknown> = {};

	for (const field of fields) {
		// 无 path 的字段 = 整文件内容（如 FooterConfig.html）
		if (!field.path || field.path.length === 0) {
			snapshot[field.id] = readFileSync(absFromRoot(field.file), "utf8");
			continue;
		}

		if (!moduleCache.has(field.file)) {
			moduleCache.set(field.file, await importFresh(absFromRoot(field.file)));
		}
		const mod = moduleCache.get(field.file)!;
		const exportName = String(field.path[0]);
		const configObj = mod[exportName];
		const raw = getByPath(configObj, field.path.slice(1));
		snapshot[field.id] = field.decode ? field.decode(raw) : raw;
	}

	return snapshot;
}
