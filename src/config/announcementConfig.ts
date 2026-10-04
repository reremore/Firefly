import type { AnnouncementConfig } from "../types/announcementConfig";

export const announcementConfig: AnnouncementConfig = {
	// 公告标题，留空则走i18n默认标题
	title: "唯此一心",

	// 公告内容
	content:
		"活着，活着……不管看到的东西如何变化……天空现在也依然是蓝色的。即使是从监狱仰望……",

	// 是否允许用户关闭公告
	closable: true,

	link: {
		// 启用链接
		enable: false,
		// 链接文本
		text: "",
		// 链接 URL
		url: "",
		// 内部链接
		external: false,
	},
};
