// Firefly 内容编辑器（文章 / 动态）—— 零依赖 vanilla JS
// 通过 window.ContentEditor.open(type) 打开，type 为 "post" | "dynamic"。

(function () {
	"use strict";

	// ── 字段声明（每种内容类型要暴露的 frontmatter 字段 + 正文） ──
	const TYPES = {
		post: {
			label: "文章",
			newLabel: "＋ 新建文章",
			emptyHint: "从左侧选择一篇文章，或点「新建文章」开始撰写。",
			fields: [
				{ key: "title", label: "标题", type: "text", placeholder: "文章标题" },
				{
					key: "category",
					label: "分类",
					type: "text",
					placeholder: "观后感 / galgame杂谈 / 学习记录",
				},
				{ key: "published", label: "发布日期", type: "date" },
				{ key: "tags", label: "标签", type: "tags", help: "用逗号分隔，例如：巡礼, 随笔" },
				{ key: "description", label: "摘要", type: "textarea" },
				{
					key: "image",
					label: "封面图路径",
					type: "text",
					placeholder: "./images/cover.avif（可留空）",
				},
				{ key: "draft", label: "草稿（线上不显示）", type: "toggle" },
				{ key: "pinned", label: "置顶", type: "toggle" },
			],
			defaults: () => ({
				title: "",
				category: "",
				published: localDate(),
				tags: [],
				description: "",
				image: "",
				draft: true,
				pinned: false,
			}),
		},
		dynamic: {
			label: "动态",
			newLabel: "＋ 新建动态",
			emptyHint: "从左侧选择一条动态，或点「新建动态」。",
			fields: [
				{
					key: "published",
					label: "发布时间",
					type: "text",
					placeholder: "2026-07-15 16:15:29",
					help: "格式 YYYY-MM-DD HH:mm:ss，留空则用当前时间。",
				},
				{ key: "location", label: "位置", type: "text", placeholder: "可留空" },
				{ key: "pinned", label: "置顶", type: "toggle" },
			],
			defaults: () => ({
				published: localDateTime(),
				location: "",
				pinned: false,
			}),
		},
	};

	// ── 小工具 ──────────────────────────────────────────────
	const pad = (n) => String(n).padStart(2, "0");

	function localDate() {
		const d = new Date();
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
	}

	function localDateTime() {
		const d = new Date();
		return `${localDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
	}

	function el(tag, attrs = {}, ...children) {
		const node = document.createElement(tag);
		for (const [k, v] of Object.entries(attrs)) {
			if (k === "class") node.className = v;
			else if (k === "text") node.textContent = v;
			else if (k.startsWith("on") && typeof v === "function")
				node.addEventListener(k.slice(2), v);
			else if (v !== null && v !== undefined) node.setAttribute(k, v);
		}
		for (const child of children.flat()) {
			if (child == null) continue;
			node.append(child.nodeType ? child : document.createTextNode(String(child)));
		}
		return node;
	}

	function toast(msg, isError = false) {
		const t = document.querySelector("#toast");
		if (!t) return;
		t.textContent = msg;
		t.className = "toast show" + (isError ? " error" : "");
		clearTimeout(t._timer);
		t._timer = setTimeout(() => (t.className = "toast"), 2600);
	}

	async function api(path, options) {
		const resp = await fetch(path, options);
		const json = await resp.json();
		if (!json.ok) throw new Error(json.error || "请求失败");
		return json;
	}

	// ── 每个内容类型的视图状态 ──────────────────────────────
	/** type → { root, listEl, mainEl, items, current, data, dirty } */
	const views = {};

	function buildView(type) {
		const cfg = TYPES[type];
		const listEl = el("ul", { class: "content-list" });
		const mainEl = el("section", { class: "content-main" });

		const newBtn = el("button", { class: "btn primary new-btn", text: cfg.newLabel });
		newBtn.addEventListener("click", () => startNew(type));

		const side = el(
			"aside",
			{ class: "content-side" },
			el("div", { class: "content-side-head" }, newBtn),
			listEl,
		);

		const root = el("div", { class: "content-view" }, side, mainEl);
		const container = document.querySelector("#view-content");
		container.append(root);

		const view = { root, listEl, mainEl, items: [], current: null, data: {}, content: "" };
		views[type] = view;
		return view;
	}

	function ensureView(type) {
		if (!views[type]) buildView(type);
		views[type].root.classList.remove("hidden");
		return views[type];
	}

	// ── 列表 ────────────────────────────────────────────────
	async function refreshList(type) {
		const view = ensureView(type);
		const { items } = await api(`/api/content/list?type=${encodeURIComponent(type)}`);
		view.items = items;
		renderList(type);
	}

	function renderList(type) {
		const view = views[type];
		view.listEl.textContent = "";

		if (view.items.length === 0) {
			view.listEl.append(el("li", { class: "content-empty-item", text: "还没有内容" }));
			return;
		}

		for (const item of view.items) {
			const active = view.current && view.current.file === item.file;
			const li = el("li", {
				class: "content-item" + (active ? " active" : ""),
				onclick: () => selectItem(type, item.file),
			});

			const titleRow = el("div", { class: "content-item-title" });
			titleRow.append(el("span", { class: "content-item-name", text: item.title }));
			if (item.draft) titleRow.append(el("span", { class: "badge draft", text: "草稿" }));
			li.append(titleRow);

			const metaParts = [];
			if (item.category) metaParts.push(item.category);
			if (item.published) metaParts.push(item.published);
			li.append(
				el("div", { class: "content-item-meta", text: metaParts.join(" · ") || item.file }),
			);

			const actions = el("div", { class: "content-item-actions" });
			const del = el("button", {
				class: "remove-btn",
				text: "删除",
				title: "删除",
				onclick: (e) => {
					e.stopPropagation();
					removeItem(type, item);
				},
			});
			actions.append(del);
			li.append(actions);

			view.listEl.append(li);
		}
	}

	// ── 编辑表单 ────────────────────────────────────────────
	function startNew(type) {
		const view = ensureView(type);
		view.current = null;
		view.data = TYPES[type].defaults();
		view.content = "";
		renderForm(type);
		renderList(type);
	}

	async function selectItem(type, file) {
		const view = ensureView(type);
		try {
			const doc = await api(
				`/api/content/item?type=${encodeURIComponent(type)}&file=${encodeURIComponent(file)}`,
			);
			view.current = { file: doc.file };
			view.data = doc.data || {};
			view.content = doc.content || "";
			renderForm(type);
			renderList(type);
		} catch (e) {
			toast(`读取失败：${e.message}`, true);
		}
	}

	function showEmptyHint(type) {
		const view = ensureView(type);
		view.mainEl.textContent = "";
		view.mainEl.append(el("div", { class: "content-empty", text: TYPES[type].emptyHint }));
	}

	function renderForm(type) {
		const cfg = TYPES[type];
		const view = views[type];
		view.mainEl.textContent = "";

		const head = el("div", { class: "content-form-head" });
		head.append(
			el("h2", {
				text: view.current ? `编辑：${view.current.file}` : `新建${cfg.label}`,
			}),
		);
		const saveBtn = el("button", { class: "btn primary", text: "保存" });
		saveBtn.addEventListener("click", () => saveItem(type, saveBtn));
		head.append(saveBtn);
		view.mainEl.append(head);

		const form = el("div", { class: "content-form" });
		view.controls = {};

		for (const field of cfg.fields) {
			const card = el("div", { class: "card" });
			const control = renderControl(field, view.data[field.key]);
			view.controls[field.key] = control;
			card.append(el("label", { class: "field-label", text: field.label }));
			card.append(control.node);
			if (field.help) card.append(el("p", { class: "field-help", text: field.help }));
			form.append(card);
		}

		// 正文
		const bodyCard = el("div", { class: "card" });
		bodyCard.append(el("label", { class: "field-label", text: "正文（Markdown）" }));
		const body = el("textarea", { class: "body-editor", rows: 18 });
		body.value = view.content;
		view.controls.__body = { node: body, read: () => body.value };
		bodyCard.append(body);
		form.append(bodyCard);

		view.mainEl.append(form);
	}

	function renderControl(field, value) {
		switch (field.type) {
			case "textarea": {
				const ta = el("textarea", { rows: 3 });
				ta.value = value ?? "";
				return { node: ta, read: () => ta.value };
			}
			case "toggle": {
				const input = el("input", { type: "checkbox" });
				input.checked = Boolean(value);
				const label = el("label", { class: "toggle" }, input, el("span", { class: "track" }));
				return { node: label, read: () => input.checked };
			}
			case "tags": {
				const input = el("input", {
					type: "text",
					placeholder: field.placeholder || "",
				});
				input.value = Array.isArray(value) ? value.join(", ") : value || "";
				return {
					node: input,
					read: () =>
						input.value
							.split(/[,，]/)
							.map((s) => s.trim())
							.filter(Boolean),
				};
			}
			default: {
				const input = el("input", {
					type: field.type === "date" ? "date" : "text",
					placeholder: field.placeholder || "",
				});
				input.value = value ?? "";
				return { node: input, read: () => input.value };
			}
		}
	}

	// ── 保存 / 删除 ─────────────────────────────────────────
	async function saveItem(type, btn) {
		const cfg = TYPES[type];
		const view = views[type];
		if (!view || !view.controls) return;

		// 以已加载的 frontmatter 为基底，避免抹掉未暴露的字段（series / license 等）
		const data = { ...(view.data || {}) };
		for (const field of cfg.fields) {
			const control = view.controls[field.key];
			if (!control) continue;
			const value = control.read();
			// 日期框被清空时保留原值，避免丢失已有时刻
			if (field.type === "date" && !value) continue;
			data[field.key] = value;
		}

		const content = view.controls.__body ? view.controls.__body.read() : view.content;

		if (type === "post" && !String(data.title || "").trim()) {
			toast("请先填写文章标题", true);
			return;
		}
		if (type === "dynamic" && !content.trim()) {
			toast("动态内容不能为空", true);
			return;
		}

		const payload = {
			type,
			file: view.current ? view.current.file : undefined,
			data,
			content,
		};

		if (btn) btn.disabled = true;
		try {
			const res = await api("/api/content/save", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			toast(`已保存：${res.file}`);
			await refreshList(type);
			await selectItem(type, res.file);
		} catch (e) {
			toast(`保存失败：${e.message}`, true);
		} finally {
			if (btn) btn.disabled = false;
		}
	}

	async function removeItem(type, item) {
		const ok = window.confirm(`确定要删除「${item.title || item.file}」吗？此操作不可撤销。`);
		if (!ok) return;
		try {
			await api("/api/content/delete", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ type, file: item.file }),
			});
			toast(`已删除：${item.file}`);
			const view = views[type];
			if (view && view.current && view.current.file === item.file) {
				view.current = null;
				view.data = {};
				view.content = "";
				showEmptyHint(type);
			}
			await refreshList(type);
		} catch (e) {
			toast(`删除失败：${e.message}`, true);
		}
	}

	// ── 对外接口 ────────────────────────────────────────────
	let loaded = {};

	window.ContentEditor = {
		async open(type) {
			if (!TYPES[type]) return;
			// 隐藏另一种内容的视图，保证同时只显示一个
			for (const [t, view] of Object.entries(views)) {
				if (t !== type) view.root.classList.add("hidden");
			}
			ensureView(type);
			if (!loaded[type]) {
				loaded[type] = true;
				showEmptyHint(type);
			}
			// 每次打开都重新扫描，避免外部改动后列表过期（只重绘列表，不动编辑中的表单）
			try {
				await refreshList(type);
			} catch (e) {
				toast(`加载失败：${e.message}`, true);
			}
		},
		/** 供页签切换时隐藏全部内容视图 */
		hideAll() {
			for (const view of Object.values(views)) view.root.classList.add("hidden");
		},
	};
})();
