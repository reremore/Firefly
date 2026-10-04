// ============================================================================
// TS-AST 补丁器：用 TypeScript 编译器 API 精准定位配置对象里的某个属性值，
// 只替换「值节点」的文本区间，文件中的注释与整体结构全部保留。
// ============================================================================

import { readFileSync, writeFileSync } from "node:fs";
import * as ts from "typescript";

/** 把 JS 值序列化为合法 TypeScript 源码（紧凑单行形式，字符串走 JSON 转义） */
export function serializeValue(value: unknown): string {
	if (value === null || value === undefined) return String(value);
	if (typeof value === "string") return JSON.stringify(value);
	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}
	if (Array.isArray(value)) {
		return `[${value.map(serializeValue).join(", ")}]`;
	}
	if (typeof value === "object") {
		const entries = Object.entries(value as Record<string, unknown>)
			.filter(([, v]) => v !== undefined)
			.map(([k, v]) => {
				const key = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
				return `${key}: ${serializeValue(v)}`;
			});
		return `{ ${entries.join(", ")} }`;
	}
	return JSON.stringify(value);
}

/** 剥掉括号 / as / satisfies / 非空断言等透明包装 */
function unwrap(e: ts.Expression): ts.Expression {
	while (
		e &&
		(ts.isAsExpression(e) ||
			ts.isParenthesizedExpression(e) ||
			ts.isTypeAssertionExpression(e) ||
			ts.isSatisfiesExpression(e) ||
			ts.isNonNullExpression(e))
	) {
		e = e.expression;
	}
	return e;
}

/** 找到 `export const <name> = ...` 的初始化表达式 */
function findExportInitializer(sf: ts.SourceFile, name: string): ts.Expression | undefined {
	for (const stmt of sf.statements) {
		if (!ts.isVariableStatement(stmt)) continue;
		const isExported = stmt.modifiers?.some(
			(m) => m.kind === ts.SyntaxKind.ExportKeyword,
		);
		if (!isExported) continue;
		for (const decl of stmt.declarationList.declarations) {
			if (ts.isIdentifier(decl.name) && decl.name.text === name && decl.initializer) {
				return unwrap(decl.initializer);
			}
		}
	}
	return undefined;
}

function propNameOf(p: ts.ObjectLiteralElementLike): string | undefined {
	const name = (p as ts.PropertyAssignment).name;
	if (!name) return undefined;
	if (
		ts.isIdentifier(name) ||
		ts.isStringLiteral(name) ||
		ts.isNumericLiteral(name) ||
		ts.isPrivateIdentifier(name)
	) {
		return name.text;
	}
	return undefined;
}

/** 沿路径下钻到目标值节点 */
function findValueNode(sf: ts.SourceFile, path: (string | number)[]): ts.Expression | undefined {
	if (path.length < 2) return undefined;
	const [exportName, ...segments] = path;
	let current = findExportInitializer(sf, String(exportName));

	for (const seg of segments) {
		if (!current) return undefined;
		current = unwrap(current);
		if (ts.isObjectLiteralExpression(current)) {
			const prop = current.properties.find((p) => propNameOf(p) === String(seg));
			if (!prop) return undefined;
			if (ts.isPropertyAssignment(prop)) {
				current = unwrap(prop.initializer);
			} else if (ts.isShorthandPropertyAssignment(prop)) {
				current = prop.name as ts.Expression;
			} else {
				return undefined;
			}
		} else if (ts.isArrayLiteralExpression(current)) {
			const idx = Number(seg);
			const el = current.elements[idx];
			if (!el || ts.isSpreadElement(el)) return undefined;
			current = unwrap(el);
		} else {
			return undefined;
		}
	}
	return current;
}

/**
 * 在指定文件的导出对象里，把 path 指向的属性值替换为 value。
 * @param absFile 配置文件绝对路径
 * @param path 对象路径，第一个元素是导出变量名
 * @param value 新值（会被 serializeValue 序列化）
 */
export function patchProperty(absFile: string, path: (string | number)[], value: unknown): void {
	const text = readFileSync(absFile, "utf8");
	const sf = ts.createSourceFile(absFile, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
	const node = findValueNode(sf, path);
	if (!node) {
		throw new Error(`未找到配置项「${path.join(".")}」（${absFile}）`);
	}
	const start = node.getStart(sf);
	const end = node.getEnd();
	const serialized = serializeValue(value);
	const newText = `${text.slice(0, start)}${serialized}${text.slice(end)}`;
	writeFileSync(absFile, newText, "utf8");
}

/** 整文件覆盖写入（用于 FooterConfig.html 这类非 TS 文件） */
export function patchWholeFile(absFile: string, content: string): void {
	writeFileSync(absFile, content, "utf8");
}
