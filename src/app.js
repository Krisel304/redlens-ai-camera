import { icon } from "./icons.js";
import { samples, templates } from "./config.js";
import { listPhotos, savePhoto, deletePhoto } from "./store.js";
import { analyze, renderImage, defaults, loadImage } from "./image.js";
import { startCamera, stopCamera, capture } from "./camera.js";
const $ = (s) => document.querySelector(s),
  app = $("#app");
const state = {
  page: "camera",
  ai: true,
  scene: "人像",
  template: "thirds",
  grid: true,
  mode: "idle",
  photos: [],
  current: null,
  sheet: false,
  expanded: true,
  analysis: null,
  selected: new Set(),
  adjust: { ...defaults },
  history: [{ ...defaults }],
  historyIndex: 0,
  facing: "environment",
  busy: false,
};
let toastTimer,
  renderSeq = 0;
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function toast(s) {
  $("#toast").textContent = s;
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 2800);
}
function btn(action, content, cls = "", extra = "") {
  return `<button class="${cls}" data-action="${action}" ${extra}>${content}</button>`;
}
function template() {
  return (
    templates[state.scene].find((t) => t.id === state.template) ||
    templates[state.scene][0]
  );
}
function grid(id = state.template) {
  return `<svg class="guide" viewBox="0 0 300 400" preserveAspectRatio="none" aria-hidden="true">${id === "center" ? '<path d="M150 0v400M0 200h300"/><circle cx="150" cy="200" r="42"/>' : id === "diagonal" ? '<path d="M0 400L300 0M0 0l300 400"/>' : id === "frame" ? '<path d="M0 260h300M75 100h150v230H75z"/>' : '<path d="M100 0v400M200 0v400M0 133h300M0 267h300"/>'}</svg>`;
}
function render() {
  const activeStream = $("#camera-video")?.srcObject;
  const page = state.page;
  app.innerHTML = `<aside class="sidebar"><a class="brand" href="/" aria-label="RedLens 首页"><span class="brand-icon">${icon("camera")}</span><span>RedLens<span class="brand-ai">AI CAMERA</span></span></a><div class="nav-label">你的摄影工作室</div><nav>${btn("camera", icon("camera") + "<span>拍摄空间</span>", page === "camera" ? "nav active" : "nav", 'aria-label="拍摄空间"')}${btn("album", icon("album") + "<span>我的相册</span>", page === "album" ? "nav active" : "nav", 'aria-label="我的相册"')}</nav><div class="sidebar-note"><span class="tiny-spark">✧</span><p>好照片，从更好的<br>看见开始。</p><span>SEE MORE. CREATE BETTER.</span></div><div class="sidebar-bottom"><span class="avatar">K</span><div>Kairos 的摄影空间<small>本地私享 · v1.2.0</small></div>${btn("about", icon("info"), "icon-btn", 'aria-label="关于应用"')}</div></aside><main class="workspace"><header class="workspace-header"><div><span class="eyebrow">YOUR EVERYDAY PHOTOGRAPHY COMPANION</span><h1>${page === "camera" ? "让每一拍，都更有把握。" : page === "album" ? "把值得的瞬间，留下来。" : page === "diagnosis" ? "看懂照片，才能拍得更好。" : page === "editor" ? "一点调整，让感觉更对。" : "每个瞬间，都值得细看。"}</h1></div><span class="privacy">${icon("check")} 照片仅保存在此设备</span></header><div class="content ${page === "camera" ? "camera-layout" : ""}">${page === "camera" ? cameraView() : page === "album" ? albumView() : page === "detail" ? detailView() : page === "diagnosis" ? diagnosisView() : editorView()}</div><footer class="workspace-footer"><span>RedLens AI Camera · 为创作多一点灵感</span><span>取景 → 构图 → 拍摄 → 诊断 → 优化</span></footer></main>${state.sheet ? sheetView() : ""}`;
  bind();
  if (
    activeStream &&
    page === "camera" &&
    state.mode === "live" &&
    $("#camera-video")
  ) {
    $("#camera-video").srcObject = activeStream;
    $("#camera-video")
      .play()
      .catch(() => {});
  }
  if (page === "editor") updatePreview();
}
function cameraView() {
  const t = template();
  return `<section class="camera-card"><div class="camera-top"><div class="camera-title">${icon("camera")}<strong>拍摄</strong><span class="live-dot"></span><small>${state.mode === "sim" ? "模拟体验" : state.mode === "live" ? "实时取景" : "准备就绪"}</small></div>${btn("simulate", "体验模拟拍摄 " + icon("right"), "simulate")}</div><div class="scene-tabs">${["智能", "人像", "风景", "静物"].map((s) => btn("scene", s === "智能" ? icon("spark") + " 智能" : s, `scene ${state.scene === s ? "selected" : ""}`, `data-scene="${s}" ${s === "智能" && !state.ai ? "disabled" : ""}`)).join("")}</div><div class="viewfinder ${state.mode === "idle" ? "empty-view" : ""}">${state.mode === "sim" ? `<img class="scene-image" src="${samples[0].url}" alt="模拟取景：手持雪板的环境人像">` : state.mode === "live" ? '<video id="camera-video" autoplay muted playsinline></video>' : `<div class="camera-empty">${icon("camera")}<h2>准备好，发现新的视角</h2><p id="camera-status">开启相机，或用样例开启一次摄影体验</p>${btn("start-camera", "开启相机", "primary")}${btn("simulate", "先体验模拟拍摄 " + icon("right"), "text-btn")}</div>`}${state.mode !== "idle" ? `<div class="viewfinder-top"><span class="mode-label">${state.mode === "sim" ? "◉ 模拟取景" : "● LIVE"}</span>${btn("grid", icon("grid"), `view-btn ${state.grid ? "on" : ""}`, 'aria-label="切换构图线" aria-pressed="' + state.grid + '"')}</div>${state.grid ? grid() : ""}<div class="focus-corner"></div>${state.ai ? `<div class="guidance">${icon("spark")}<div><b>${t.name} · ${state.scene}摄影</b><span>${t.desc}</span></div></div>` : ""}<div class="viewfinder-bottom"><span>1×</span><span>3 : 4</span></div>` : ""}</div><div class="camera-controls"><div class="ai-control"><span>${icon("spark")} AI 辅助 <small>${state.ai ? "已开启" : "已关闭"}</small></span>${btn("ai", "<span></span>", `toggle ${state.ai ? "on" : ""}`, 'role="switch" aria-label="AI 辅助" aria-checked="' + state.ai + '"')}</div><div class="shutter-row">${btn("album", state.photos.length ? `<img src="${state.photos[0].url}" alt="最新照片">` : icon("album"), "album-control", 'aria-label="打开相册"')}<div class="shutter-wrap">${btn("capture", "<span></span>", "shutter", `${state.mode === "idle" ? "disabled" : ""} aria-label="拍照"`)}<span>照片</span></div>${btn("templates", icon("grid") + "<small>构图模板</small>", "template-control")}</div><div class="capture-foot">${state.mode === "sim" ? btn("start-camera", icon("switch") + " 切换真实相机", "text-btn") : state.mode === "live" ? btn("switch-camera", icon("switch") + " 切换镜头", "text-btn") : btn("upload", icon("upload") + " 导入照片", "text-btn")}<span>JPG · 本地保存</span></div></div></section><aside class="assistant-panel"><div class="assistant-heading"><span class="assistant-symbol">${icon("spark")}</span><div><h2>你的随身摄影助手</h2><p>多一点引导，少一点碰运气</p></div><span class="beta">BETA</span></div><div class="assistant-section"><div class="section-label"><span>${state.ai ? "为当前场景推荐" : "手动构图"}</span><span class="local-tag">${state.ai ? "本地辅助" : "AI 已关闭"}</span></div><div class="recommend-card"><div class="template-art">${grid(t.id)}<span class="subject-dot"></span><span class="mini-label">${t.name}</span></div><div class="recommend-copy"><span class="coral-caption">${state.ai ? "✧ RECOMMENDED" : "COMPOSITION"}</span><h3>${t.name}</h3><p>${t.desc}</p><span class="tag">${t.tag}</span></div></div>${btn("templates", "探索全部构图 " + icon("right"), "all-templates")}</div><div class="assistant-section tips"><div class="section-label"><span>从看见，到好照片</span><span>01 — 03</span></div><div class="tip"><span>01</span><div><b>先找到你的主角</b><p>明确主体，把无关的元素留在画面外。</p></div></div><div class="tip"><span>02</span><div><b>让构图帮你表达</b><p>选择构图模板，让引导线成为你的参考。</p></div></div><div class="tip"><span>03</span><div><b>拍下，再进步一点</b><p>通过照片诊断，看懂光影与色彩的变化。</p></div></div></div><div class="sample-callout"><div><span class="eyebrow">A LITTLE INSPIRATION</span><h3>从一张照片开始探索</h3><p>4 张实拍样例，体验完整创作过程。</p>${btn("album", "浏览样例 " + icon("right"), "text-btn")}</div><img src="/assets/sunset.webp" alt="雪场日落"></div><p class="capability-note">${icon("info")} 当前使用本地像素分析与构图规则，未接入云端视觉模型。照片不会上传至服务器。</p></aside>`;
}
function albumView() {
  return `<section class="album-page"><div class="page-toolbar"><div><h2>我的相册 <span>${state.photos.length}</span></h2><p>每一次创作，都有迹可循。</p></div>${btn("upload", icon("upload") + " 导入照片", "primary")}</div><section class="samples-section"><div class="samples-heading">${btn("expand", `<strong>灵感样例</strong><span>4 张 · 不计入我的照片</span>${icon("chevron")}`, state.expanded ? "expanded" : "")}<div>${btn("sample-prev", icon("arrow"), "icon-btn", 'aria-label="上一张样例"')}${btn("sample-next", icon("right"), "icon-btn", 'aria-label="下一张样例"')}</div></div>${state.expanded ? `<div class="sample-strip">${samples.map((p) => `<button class="sample-photo" data-action="sample" data-id="${p.id}"><img src="${p.url}" alt="${p.name}" draggable="false"><div><b>${p.name}</b><small>${p.location}</small></div><span class="sample-tag">${p.scene}</span></button>`).join("")}</div>` : ""}</section><div class="section-label"><h3>我的照片</h3><span>仅此设备可见</span></div>${state.photos.length ? `<div class="photo-grid">${state.photos.map((p) => `<button class="photo-tile" data-action="photo" data-id="${p.id}"><img src="${p.url}" alt="${esc(p.name)}"><div><b>${esc(p.name)}</b><small>${p.edited ? "编辑版本" : p.source} · ${new Date(p.created).toLocaleDateString("zh-CN")}</small></div></button>`).join("")}</div>` : `<div class="empty-album">${icon("album")}<h3>你的下一张好照片，从这里开始</h3><p>拍一张，或导入一张喜欢的照片。</p>${btn("camera", "去拍摄 " + icon("right"), "secondary")}</div>`}</section>`;
}
function pageBack(action, label) {
  return btn(action, icon("arrow") + label, "back-btn");
}
function detailView() {
  const p = state.current;
  return `<section class="detail-page">${pageBack("album", "返回相册")}<div class="detail-layout"><div class="photo-stage"><img src="${p.url}" alt="${esc(p.name)}"></div><div class="detail-info"><span class="eyebrow">A MOMENT WORTH KEEPING</span><h2>${esc(p.name)}</h2><p>${p.location || "属于你的摄影瞬间"}</p><div class="metadata"><span>${esc(p.source || "导入照片")}</span><span>${p.edited ? "已编辑 · 原图保留" : "原始照片"}</span></div><div class="diagnose-promo">${icon("spark")}<h3>发现照片的更多可能</h3><p>从亮度、色彩、细节等像素指标，了解这张照片的表现。</p>${btn("diagnose", "开始照片诊断 " + icon("right"), "primary wide")}</div>${btn("edit", icon("edit") + " 手动编辑", "secondary wide")}<div class="detail-actions">${btn("download", icon("download") + " 下载", "text-btn")}${btn("share", icon("share") + " 分享", "text-btn")}${!samples.some((x) => x.id === p.id) ? btn("delete", icon("trash") + " 删除", "text-btn danger") : ""}</div><p class="capability-note">诊断使用本地算法。像素指标仅供参考，无法判断人物表情、画面意图或审美质量。</p></div></div></section>`;
}
function diagnosisView() {
  const a = state.analysis;
  return `<section class="diagnosis-page">${pageBack("detail", "返回照片")}<div class="diagnosis-layout"><div class="diagnosis-photo"><img src="${state.current.url}" alt="正在诊断的照片"><span>本地像素分析 · 非云端模型</span></div><div class="diagnosis-content"><div class="section-label"><span>PHOTO INSIGHTS</span><span class="local-tag">分析完成</span></div><div class="score-row"><div class="score-circle" style="--score:${a.total}%"><strong>${a.total}<small>/ 100</small></strong></div><div><h2>每张照片，都有自己的光</h2><p>像素指标参考分 · 不代表审美评价</p></div></div><div class="scores">${a.scores.map((s) => `<div><span>${s.name}</span><div><i style="width:${s.value}%"></i></div><b>${s.value}</b></div>`).join("")}</div><div class="highlight">${icon("sun")}<p>${a.highlight}</p></div><div class="section-label"><h3>可以尝试的调整</h3><span>${a.issues.length} 项建议</span></div><div class="issues">${a.issues.length ? a.issues.map((i) => `<label class="issue"><input type="checkbox" data-issue="${i.id}" ${state.selected.has(i.id) ? "checked" : ""}><span><b>${i.title}</b><small>${i.detail}</small></span></label>`).join("") : '<p class="balanced">亮度与色彩处于参考范围内。你仍可以进入编辑，自由探索个人风格。</p>'}</div>${btn("apply", "应用所选建议 " + icon("right"), "primary wide")}${btn("edit", "自由编辑", "text-btn wide")}<p class="capability-note">这些建议来自当前照片的真实像素统计。构图与主体语义仍需由你判断，调整不会恢复过曝丢失的细节。</p></div></div></section>`;
}
function editorView() {
  return `<section class="editor-page"><div class="editor-top">${pageBack("detail", "返回照片")}<span>编辑工作室</span>${btn("save", "保存新版本", "primary", state.busy ? "disabled" : "")}</div><div class="editor-layout"><div class="edit-stage"><canvas id="edit-canvas"></canvas><span class="edit-label">编辑预览</span></div><div class="edit-panel"><div class="section-label"><h3>${icon("edit")} 基础调整</h3>${btn("reset", "重置", "text-btn")}</div>${[
    ["brightness", "曝光"],
    ["contrast", "对比度"],
    ["saturation", "饱和度"],
    ["warmth", "色温"],
  ]
    .map(
      ([key, name]) =>
        `<label class="slider-label"><span>${name}<b id="value-${key}">${state.adjust[key]}</b></span><input type="range" min="-60" max="60" value="${state.adjust[key]}" data-adjust="${key}" aria-label="${name}"></label>`,
    )
    .join(
      "",
    )}<div class="section-label"><h3>画幅与方向</h3>${btn("rotate", icon("rotate"), "icon-btn", 'aria-label="旋转90度"')}</div><div class="crop-options">${[
    ["original", "原始"],
    ["portrait", "3 : 4"],
    ["square", "1 : 1"],
  ]
    .map(([id, name]) =>
      btn(
        "crop",
        name,
        state.adjust.crop === id ? "selected" : "",
        `data-crop="${id}"`,
      ),
    )
    .join(
      "",
    )}</div><div class="edit-history">${btn("undo", icon("undo") + " 撤销", "text-btn", state.historyIndex === 0 ? "disabled" : "")}${btn("redo", icon("redo") + " 重做", "text-btn", state.historyIndex === state.history.length - 1 ? "disabled" : "")}</div>${btn("compare", "按住查看原图", "secondary wide")}<p class="capability-note">所有调整均真实作用于图像像素。保存会创建一个新版本，原图保持完整。</p></div></div></section>`;
}
function sheetView() {
  return `<div class="sheet-backdrop" data-action="close-sheet"><section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title"><div class="sheet-handle"></div><header><div><span class="eyebrow">FIND YOUR FRAME</span><h2 id="sheet-title">让构图，成为你的表达</h2></div>${btn("close-sheet", icon("close"), "icon-btn", 'aria-label="关闭模板"')}</header><div class="scene-tabs">${["人像", "风景", "静物"].map((s) => btn("scene", s, state.scene === s ? "scene selected" : "scene", `data-scene="${s}"`)).join("")}</div><div class="template-list">${templates[state.scene].map((t, i) => btn("select-template", `<div class="template-mini">${grid(t.id)}<span class="subject-dot"></span></div><div>${state.ai && i === 0 ? '<small class="coral-caption">✧ 推荐构图</small>' : ""}<h3>${t.name}</h3><p>${t.desc}</p><span class="tag">${t.tag}</span></div>${state.template === t.id ? icon("check") : ""}`, `template-option ${state.template === t.id ? "selected" : ""}`, `data-template="${t.id}"`)).join("")}</div><p class="capability-note">${state.ai ? "推荐依据：你选择的场景与内置摄影规则，不代表语义识别结果。" : "AI 辅助已关闭，你可以自由选择手动构图。"}</p></section></div>`;
}
async function go(page) {
  if (state.page === "editor" && page !== "editor") renderSeq++;
  if (page !== "camera") stopCamera();
  state.page = page;
  state.sheet = false;
  if (page === "album") state.photos = await listPhotos();
  render();
}
async function addPhoto(url, source, name = "新的摄影瞬间", extra = {}) {
  const p = {
    id: crypto.randomUUID(),
    url,
    source,
    name,
    created: Date.now(),
    ...extra,
  };
  await savePhoto(p);
  state.photos = await listPhotos();
  return p;
}
async function enterEditor(adjust = {}) {
  state.adjust = { ...defaults, ...adjust };
  state.history = [{ ...state.adjust }];
  state.historyIndex = 0;
  await go("editor");
}
function historyPush() {
  const last = state.history[state.historyIndex];
  if (JSON.stringify(last) === JSON.stringify(state.adjust)) return;
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push({ ...state.adjust });
  state.historyIndex++;
}
async function updatePreview(original = false) {
  const seq = ++renderSeq;
  try {
    const c = await renderImage(
      state.current.url,
      original ? defaults : state.adjust,
      1400,
    );
    if (seq !== renderSeq || state.page !== "editor") return;
    const target = $("#edit-canvas");
    target.width = c.width;
    target.height = c.height;
    target.getContext("2d").drawImage(c, 0, 0);
  } catch (e) {
    toast(e.message);
  }
}
async function cameraStart() {
  if (state.busy) return;
  state.busy = true;
  state.mode = "live";
  render();
  try {
    await startCamera($("#camera-video"), state.facing);
    toast("相机已就绪");
  } catch (e) {
    state.mode = "idle";
    render();
    $("#camera-status").textContent = e.message;
  } finally {
    state.busy = false;
  }
}
async function action(name, el) {
  try {
    if (name === "camera") {
      stopCamera();
      state.mode = "idle";
      await go("camera");
    }
    if (name === "simulate") {
      stopCamera();
      state.mode = "sim";
      state.scene = "人像";
      state.template = "thirds";
      state.page = "camera";
      render();
      toast("模拟取景已开启 · 使用滑雪人像样例");
    }
    if (name === "start-camera") await cameraStart();
    if (name === "switch-camera") {
      state.facing = state.facing === "environment" ? "user" : "environment";
      await cameraStart();
    }
    if (name === "ai") {
      state.ai = !state.ai;
      render();
    }
    if (name === "grid") {
      state.grid = !state.grid;
      render();
    }
    if (name === "scene") {
      const scene = el.dataset.scene;
      if (scene === "智能") {
        if (!state.ai) return;
        toast("智能场景识别尚未接入语义模型，请手动选择场景");
        return;
      }
      state.scene = scene;
      state.template = templates[scene][0].id;
      const vid = $("#camera-video")?.srcObject;
      render();
      if (vid) {
        $("#camera-video").srcObject = vid;
        $("#camera-video")
          .play()
          .catch(() => {});
      }
    }
    if (name === "templates") {
      state.sheet = true;
      render();
      $(".sheet .icon-btn")?.focus();
    }
    if (name === "close-sheet") {
      state.sheet = false;
      render();
    }
    if (name === "select-template") {
      state.template = el.dataset.template;
      state.sheet = false;
      render();
      toast("已使用" + template().name);
    }
    if (name === "album") await go("album");
    if (name === "expand") {
      state.expanded = !state.expanded;
      render();
    }
    if (name === "sample-prev" || name === "sample-next")
      $(".sample-strip")?.scrollBy({
        left: name === "sample-next" ? 300 : -300,
        behavior: "smooth",
      });
    if (name === "sample" || name === "photo") {
      state.current =
        name === "sample"
          ? samples.find((x) => x.id === el.dataset.id)
          : state.photos.find((x) => x.id === el.dataset.id);
      await go("detail");
    }
    if (name === "detail") await go("detail");
    if (name === "upload") $("#upload").click();
    if (name === "capture") {
      if (state.busy || state.mode === "idle") return;
      state.busy = true;
      $(".viewfinder").classList.add("flash");
      try {
        const url =
          state.mode === "sim"
            ? (await renderImage(samples[0].url)).toDataURL("image/jpeg", 0.94)
            : capture($("#camera-video"));
        state.current = await addPhoto(
          url,
          state.mode === "sim" ? "模拟拍摄" : "相机拍摄",
          state.mode === "sim" ? "雪场里的一个瞬间" : "新的摄影瞬间",
        );
        await go("detail");
        toast("已拍摄并保存到相册");
      } finally {
        state.busy = false;
      }
    }
    if (name === "diagnose") {
      if (state.busy) return;
      state.busy = true;
      el.disabled = true;
      el.textContent = "正在分析照片…";
      try {
        state.analysis = await analyze(state.current.url);
        state.selected = new Set(state.analysis.issues.map((i) => i.id));
        await go("diagnosis");
      } finally {
        state.busy = false;
        el.disabled = false;
      }
    }
    if (name === "edit") await enterEditor();
    if (name === "apply") {
      const adjust = {};
      state.analysis.issues
        .filter((i) => state.selected.has(i.id))
        .forEach((i) => Object.assign(adjust, i.adjust));
      await enterEditor(adjust);
    }
    if (name === "crop") {
      state.adjust.crop = el.dataset.crop;
      historyPush();
      render();
    }
    if (name === "rotate") {
      state.adjust.rotation = (state.adjust.rotation + 90) % 360;
      historyPush();
      render();
    }
    if (name === "reset") {
      state.adjust = { ...defaults };
      historyPush();
      render();
    }
    if (name === "undo" && state.historyIndex > 0) {
      state.adjust = { ...state.history[--state.historyIndex] };
      render();
    }
    if (name === "redo" && state.historyIndex < state.history.length - 1) {
      state.adjust = { ...state.history[++state.historyIndex] };
      render();
    }
    if (name === "save") {
      if (state.busy) return;
      state.busy = true;
      el.disabled = true;
      try {
        const c = await renderImage(state.current.url, state.adjust);
        const old = state.current;
        state.current = await addPhoto(
          c.toDataURL("image/jpeg", 0.94),
          "编辑版本",
          old.name.replace(/ · 编辑$/, "") + " · 编辑",
          { edited: true, parentId: old.id },
        );
        await go("detail");
        toast("新版本已保存，原图已保留");
      } finally {
        state.busy = false;
        el.disabled = false;
      }
    }
    if (name === "download") {
      const c = await renderImage(state.current.url);
      const a = document.createElement("a");
      a.href = c.toDataURL("image/jpeg", 0.94);
      a.download = "RedLens-" + Date.now() + ".jpg";
      a.click();
      toast("照片已准备下载");
    }
    if (name === "share") {
      const blob = await (await fetch(state.current.url)).blob();
      const file = new File([blob], "RedLens.jpg", { type: blob.type });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "RedLens 摄影瞬间" });
        } catch (e) {
          if (e.name !== "AbortError") throw e;
        }
      } else toast("当前浏览器不支持图片分享，请使用下载按钮");
    }
    if (name === "delete") {
      if (confirm("删除这张照片？此操作无法撤销。")) {
        await deletePhoto(state.current.id);
        await go("album");
        toast("照片已删除");
      }
    }
    if (name === "about")
      toast("RedLens v1.2.0 · 本地像素分析 · 照片仅存此设备");
  } catch (e) {
    console.error(e);
    toast("操作未完成：" + e.message);
  }
}
function bind() {
  app.querySelectorAll("[data-action]").forEach((el) =>
    el.addEventListener("click", (e) => {
      if (el.classList.contains("sheet-backdrop") && e.target !== el) return;
      action(el.dataset.action, el);
    }),
  );
  $(".sheet")?.addEventListener("click", (e) => e.stopPropagation());
  app
    .querySelectorAll("[data-issue]")
    .forEach(
      (el) =>
        (el.onchange = () =>
          el.checked
            ? state.selected.add(el.dataset.issue)
            : state.selected.delete(el.dataset.issue)),
    );
  app.querySelectorAll("[data-adjust]").forEach((el) => {
    el.oninput = () => {
      state.adjust[el.dataset.adjust] = +el.value;
      $("#value-" + el.dataset.adjust).textContent = el.value;
      updatePreview();
    };
    el.onchange = () => {
      historyPush();
      render();
    };
  });
  const compare = $('[data-action="compare"]');
  if (compare) {
    compare.onpointerdown = (e) => {
      e.preventDefault();
      compare.setPointerCapture(e.pointerId);
      updatePreview(true);
    };
    compare.onpointerup = () => updatePreview();
    compare.onpointercancel = () => updatePreview();
    compare.onkeydown = (e) => {
      if (e.key === " ") updatePreview(true);
    };
    compare.onkeyup = () => updatePreview();
  }
  const strip = $(".sample-strip");
  if (strip) {
    let down = false,
      x = 0,
      left = 0,
      moved = false;
    strip.onpointerdown = (e) => {
      if (e.pointerType === "touch") return;
      down = true;
      x = e.clientX;
      left = strip.scrollLeft;
      moved = false;
    };
    strip.onpointermove = (e) => {
      if (!down) return;
      if (Math.abs(e.clientX - x) > 5) {
        moved = true;
        strip.scrollLeft = left - (e.clientX - x);
      }
    };
    window.onpointerup = () => {
      down = false;
    };
    strip.addEventListener(
      "click",
      (e) => {
        if (moved) {
          e.preventDefault();
          e.stopImmediatePropagation();
          moved = false;
        }
      },
      true,
    );
    strip.addEventListener(
      "wheel",
      (e) => {
        if (
          Math.abs(e.deltaY) > Math.abs(e.deltaX) &&
          strip.scrollWidth > strip.clientWidth
        ) {
          e.preventDefault();
          strip.scrollLeft += e.deltaY;
        }
      },
      { passive: false },
    );
  }
}
$("#upload").onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    if (file.size > 30 * 1024 * 1024) throw Error("请选择小于 30MB 的照片");
    const url = URL.createObjectURL(file);
    try {
      await loadImage(url);
      const c = await renderImage(url);
      state.current = await addPhoto(
        c.toDataURL("image/jpeg", 0.94),
        "导入照片",
        file.name.replace(/\.[^.]+$/, ""),
      );
      await go("detail");
      toast("照片已导入");
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    toast(err.message);
  } finally {
    e.target.value = "";
  }
};
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && state.sheet) {
    state.sheet = false;
    render();
  }
  if (state.sheet && e.key === "Tab") {
    const focus = [...$(".sheet").querySelectorAll("button:not([disabled])")];
    if (e.shiftKey && document.activeElement === focus[0]) {
      e.preventDefault();
      focus.at(-1).focus();
    } else if (!e.shiftKey && document.activeElement === focus.at(-1)) {
      e.preventDefault();
      focus[0].focus();
    }
  }
});
window.addEventListener("pagehide", stopCamera);
document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.mode === "live") {
    stopCamera();
    state.mode = "idle";
    if (state.page === "camera") render();
  }
});
try {
  state.photos = await listPhotos();
} catch {
  toast("浏览器本地存储不可用，保存功能可能受限");
}
render();
