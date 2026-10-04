import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// 本文件位于 <project>/tools/firefly-admin/paths.ts
// 因此项目根目录 = 上两级
const here = dirname(fileURLToPath(import.meta.url));

/** 项目根目录（Firefly 仓库根） */
export const projectRoot = resolve(here, "..", "..");

/** 将 schema 中相对项目根的路径解析为绝对路径 */
export function absFromRoot(p: string): string {
	return resolve(projectRoot, p);
}
