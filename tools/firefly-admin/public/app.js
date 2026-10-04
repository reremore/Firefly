// Firefly 配置编辑器前端（零依赖 vanilla JS，schema 驱动）

const state = {}; // fieldId -> 当前 UI 值
const dirty = new Set(); // 待保存的 fieldId
let schemaFields = [];

const $ = (sel) => document.querySelector(sel);

// ── DOM 工具 ────────────────────────────────────────────────
function el(tag, attrs = {}, ...children) {
	const node = document.createElement(tag);
	for (const [k, v] of Object.entries(attrs)) {
		if (k === "class") node.className = v;
		else if (k === "text") node.textContent = v;
		else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
		else if (v !== null && v !== undefined) node.setAttribute(k, v);
	}
	for (const child of children.flat()) {
		if (child == null) continue;
		node.append(child.nodeType ? child : document.createTextNode(String(child)));
	}
	return node;
}

function mediaUrl(path) {
	return path ? "/media?path=" + encodeURIComponent(path) : "";
}

function toast(msg, isError = false) {
	const t = $("#toast");
	t.textContent = msg;
	t.className = "toast show" + (isError ? " error" : "");
	clearTimeout(t._timer);
	t._timer = setTimeout(() => (t.className = "toast"), 2600);
}

function markDirty(id, value) {
	state[id] = value;
	dirty.add(id);
	updateSaveButton();
}

function updateSaveButton() {
	const btn = $("#btn-save");
	btn.disabled = dirty.size === 0;
	btn.textContent = dirty.size ? `保存更改 (${dirty.size})` : "保存更改";
}

// ── 字段控件渲染 ───────────────────────────────────────────
function renderField(field, value) {
	const card = el("div", { class: "card" });
	card.append(el("label", { class: "field-label", text: field.label }));

	let control;
	switch (field.type) {
		case "text":
		case "number":
			control = renderText(field, value, field.type === "number");
			break;
		case "textarea":
			control = renderTextarea(field, value);
			break;
		case "hue":
			control = renderHue(field, value);
			break;
		case "toggle":
			control = renderToggle(field, value);
			break;
		case "select":
			control = renderSelect(field, value);
			break;
		case "image":
			control = renderImage(field, value);
			break;
		case "string-list":
			control = renderStringList(field, value);
			break;
		case "image-list":
			control = renderImageList(field, value);
			break;
		case "link-list":
			control = renderLinkList(field, value);
			break;
		default:
			control = el("div", { text: `未知字段类型 ${field.type}` });
	}

	card.append(control);
	if (field.help) card.append(el("p", { class: "field-help", text: field.help }));
	return card;
}

function renderText(field, value, numeric = false) {
	const input = el("input", {
		type: numeric ? "number" : "text",
		value: value ?? "",
		placeholder: field.placeholder || "",
	});
	if (numeric) input.setAttribute("step", "1");
	input.addEventListener("input", () =>
		markDirty(field.id, numeric ? Number(input.value) : input.value),
	);
	return input;
}

function renderTextarea(field, value) {
	const ta = el("textarea", { rows: field.id === "footer.html" ? 8 : 3 }, value ?? "");
	ta.addEventListener("input", () => markDirty(field.id, ta.value));
	return ta;
}

function renderHue(field, value) {
	const hue = Number(value ?? 165);
	const range = el("input", {
		type: "range",
		min: "0",
		max: "360",
		value: String(hue),
	});
	const swatch = el("span", { class: "hue-swatch" });
	const val = el("span", { class: "hue-value", text: `${hue}°` });
	const paint = () => {
		swatch.style.background = `hsl(${hue} 90% 60%)`;
	};
	paint();
	range.addEventListener("input", () => {
		const v = Number(range.value);
		val.textContent = `${v}°`;
		swatch.style.background = `hsl(${v} 90% 60%)`;
		markDirty(field.id, v);
	});
	return el("div", { class: "hue-row" }, range, swatch, val);
}

function renderToggle(field, value) {
	const input = el("input", { type: "checkbox" });
	input.checked = Boolean(value);
	input.addEventListener("change", () => markDirty(field.id, input.checked));
	const label = el("label", { class: "toggle" }, input, el("span", { class: "track" }));
	return label;
}

function renderSelect(field, value) {
	const select = el("select");
	for (const opt of field.options || []) {
		select.append(el("option", { value: opt.value, text: opt.label }));
	}
	select.value = value ?? "";
	select.addEventListener("change", () => markDirty(field.id, select.value));
	return select;
}

// ── 图片字段 ───────────────────────────────────────────────
function renderImage(field, value) {
	const path = typeof value === "string" ? value : "";
	const thumb = el("img", { class: "thumb", src: mediaUrl(path), alt: "" });
	const input = el("input", { type: "text", value: path, readonly: true });
	const uploadBtn = el("button", { class: "btn", text: "上传" });
	const fileInput = el("input", { type: "file", accept: "image/*", style: "display:none" });

	const setPath = (p) => {
		input.value = p;
		thumb.src = mediaUrl(p);
		markDirty(field.id, p);
	};

	uploadBtn.addEventListener("click", () => fileInput.click());
	fileInput.addEventListener("change", async () => {
		const file = fileInput.files[0];
		if (!file) return;
		try {
			const p = await uploadImage(field.dest, file);
			setPath(p);
		} catch (e) {
			toast(`上传失败：${e.message}`, true);
		}
	});

	return el("div", { class: "image-row" }, thumb, input, uploadBtn, fileInput);
}

// ── 字符串列表 ─────────────────────────────────────────────
function renderStringList(field, value) {
	const items = Array.isArray(value) ? value : [];
	const wrap = el("div");
	const addBtn = el("button", { class: "add-btn", text: "＋ 添加" });

	const sync = () => markDirty(field.id, readItems());
	const readItems = () => [...wrap.querySelectorAll("input[type='text']")].map((i) => i.value);

	const drawRow = (text) => {
		const input = el("input", { type: "text", value: text ?? "" });
		const remove = el("button", { class: "remove-btn", text: "×", title: "删除" });
		input.addEventListener("input", sync);
		remove.addEventListener("click", () => {
			row.remove();
			sync();
		});
		const row = el("div", { class: "list-item" }, input, remove);
		return row;
	};

	for (const item of items) wrap.append(drawRow(item));
	addBtn.addEventListener("click", () => {
		wrap.insertBefore(drawRow(""), addBtn);
		sync();
	});
	wrap.append(addBtn);
	return wrap;
}

// ── 图片列表（壁纸） ───────────────────────────────────────
function renderImageList(field, value) {
	const items = Array.isArray(value) ? value : [];
	const wrap = el("div");
	const addBtn = el("button", { class: "add-btn", text: "＋ 上传图片" });
	const fileInput = el("input", { type: "file", accept: "image/*", style: "display:none" });

	const sync = () => markDirty(field.id, [...wrap.querySelectorAll(".list-item")].map((row) => row._path));
	const drawRow = (path) => {
		const thumb = el("img", { class: "thumb", src: mediaUrl(path), alt: "" });
		const input = el("input", { type: "text", value: path ?? "" });
		const remove = el("button", { class: "remove-btn", text: "×", title: "删除" });
		input.addEventListener("input", () => {
			row._path = input.value;
			thumb.src = mediaUrl(input.value);
			sync();
		});
		remove.addEventListener("click", () => {
			row.remove();
			sync();
		});
		const row = el("div", { class: "list-item" }, thumb, input, remove);
		row._path = path ?? "";
		return row;
	};

	for (const item of items) wrap.append(drawRow(item));
	addBtn.addEventListener("click", () => fileInput.click());
	fileInput.addEventListener("change", async () => {
		const file = fileInput.files[0];
		if (!file) return;
		try {
			const p = await uploadImage(field.dest, file);
			wrap.insertBefore(drawRow(p), addBtn);
			sync();
		} catch (e) {
			toast(`上传失败：${e.message}`, true);
		}
		fileInput.value = "";
	});
	wrap.append(addBtn);
	return wrap;
}

// ── 链接列表 ───────────────────────────────────────────────
function renderLinkList(field, value) {
	const items = Array.isArray(value) ? value : [];
	const keys = field.itemSchema || [];
	const wrap = el("div");
	const addBtn = el("button", { class: "add-btn", text: "＋ 添加链接" });

	const sync = () => markDirty(field.id, readItems());
	const readItems = () =>
		[...wrap.querySelectorAll(".link-card")].map((card) => {
			const obj = {};
			for (const k of keys) {
				if (k.type === "toggle") {
					const cb = card.querySelector(`input[data-key="${k.key}"]`);
					obj[k.key] = cb.checked;
				} else {
					const inp = card.querySelector(`input[data-key="${k.key}"]`);
					obj[k.key] = inp.value;
				}
			}
			return obj;
		});

	const drawCard = (item = {}) => {
		const card = el("div", { class: "link-card" });
		const head = el("div", { class: "item-head" });
		head.append(el("span", { text: "链接" }));
		const remove = el("button", { class: "remove-btn", text: "×", title: "删除" });
		remove.addEventListener("click", () => {
			card.remove();
			sync();
		});
		head.append(remove);
		card.append(head);

		for (const k of keys) {
			const col = el("div");
			col.append(el("label", { text: k.label }));
			let input;
			if (k.type === "toggle") {
				const cb = el("input", { type: "checkbox", "data-key": k.key });
				cb.checked = Boolean(item[k.key]);
				cb.addEventListener("change", sync);
				input = el("label", { class: "toggle" }, cb, el("span", { class: "track" }));
			} else {
				input = el("input", { type: "text", "data-key": k.key, value: item[k.key] ?? "" });
				input.addEventListener("input", sync);
			}
			col.append(input);
			card.append(col);
		}
		return card;
	};

	for (const item of items) wrap.append(drawCard(item));
	addBtn.addEventListener("click", () => {
		wrap.insertBefore(drawCard(), addBtn);
		sync();
	});
	wrap.append(addBtn);
	return wrap;
}

// ── 图片上传 ───────────────────────────────────────────────
async function uploadImage(dest, file) {
	const url = "/api/upload?dest=" + encodeURIComponent(dest) + "&filename=" + encodeURIComponent(file.name);
	const resp = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/octet-stream" },
		body: file,
	});
	const json = await resp.json();
	if (!json.ok) throw new Error(json.error || "上传失败");
	return json.path;
}

// ── 渲染主界面 ─────────────────────────────────────────────
function renderSections(fields) {
	const nav = $("#sections");
	const main = $("#fields");
	nav.textContent = "";
	main.textContent = "";

	const bySection = new Map();
	for (const f of fields) {
		if (!bySection.has(f.section)) bySection.set(f.section, []);
		bySection.get(f.section).push(f);
	}

	for (const [section, list] of bySection) {
		const link = el("a", { href: `#sec-${section}`, text: section });
		nav.append(link);

		const sec = el("div", { class: "section", id: `sec-${section}` });
		sec.append(el("h2", { text: section }));
		for (const f of list) sec.append(renderField(f, state[f.id]));
		main.append(sec);
	}
}

// ── 保存 ───────────────────────────────────────────────────
async function save() {
	if (dirty.size === 0) return;
	const payload = {};
	for (const id of dirty) payload[id] = state[id];
	const btn = $("#btn-save");
	btn.disabled = true;
	try {
		const resp = await fetch("/api/config", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
		const json = await resp.json();
		if (!json.ok) throw new Error(json.error);
		const n = dirty.size;
		dirty.clear();
		updateSaveButton();
		toast(`已保存 ${n} 处更改`);
	} catch (e) {
		toast(`保存失败：${e.message}`, true);
		updateSaveButton();
	}
}

// ── 预览 ───────────────────────────────────────────────────
async function refreshPreviewStatus() {
	const status = $("#preview-status");
	try {
		const resp = await fetch("/api/preview-status");
		const json = await resp.json();
		if (json.running) {
			status.textContent = "预览服务在线";
			status.className = "status on";
		} else {
			status.textContent = "预览未启动（pnpm dev）";
			status.className = "status off";
		}
	} catch {
		status.textContent = "预览状态未知";
		status.className = "status";
	}
}

function togglePreview(force) {
	const pane = $("#preview");
	const frame = $("#preview-frame");
	const show = force !== undefined ? force : pane.classList.contains("hidden");
	if (show) {
		pane.classList.remove("hidden");
		if (!frame.src) frame.src = "http://localhost:4321";
	} else {
		pane.classList.add("hidden");
	}
}

// ── 启动 ───────────────────────────────────────────────────
async function boot() {
	try {
		const [schemaResp, configResp] = await Promise.all([
			fetch("/api/schema"),
			fetch("/api/config"),
		]);
		const { fields } = await schemaResp.json();
		const config = await configResp.json();
		schemaFields = fields;
		for (const f of fields) state[f.id] = config[f.id];
		renderSections(fields);
	} catch (e) {
		toast(`加载失败：${e.message}`, true);
	}

	$("#btn-save").addEventListener("click", save);
	$("#btn-preview").addEventListener("click", () => togglePreview());
	$("#btn-close-preview").addEventListener("click", () => togglePreview(false));
	$("#btn-refresh-preview").addEventListener("click", () => {
		const frame = $("#preview-frame");
		frame.src = "http://localhost:4321";
	});
	refreshPreviewStatus();
	setInterval(refreshPreviewStatus, 5000);
}

boot();
