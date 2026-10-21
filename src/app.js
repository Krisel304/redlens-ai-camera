import { createViews } from "./views.js";
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
  dialog: null,
  editTab: "brightness",
  returnPage: "album",
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
  clearTimeout(toastTimer);
  $("#toast").classList.remove("show");
  const inline =
    state.page === "camera" && ($(".composition-hint") || $("#camera-status"));
  if (inline) {
    const original = inline.innerHTML;
    inline.textContent = s;
    toastTimer = setTimeout(() => {
      if (inline.isConnected) inline.innerHTML = original;
    }, 2800);
    return;
  }
  $("#toast").textContent = s;
  $("#toast").classList.add("show");
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
const views = createViews({
  state,
  btn,
  icon,
  esc,
  grid,
  samples,
  templates,
  template,
});
function render() {
  if (state.dialog) {
    $("#toast").classList.remove("show");
    clearTimeout(toastTimer);
  }
  const activeStream = $("#camera-video")?.srcObject;
  const scrollTop = state.resetScroll ? 0 : $(".scroll-screen")?.scrollTop || 0;
  state.resetScroll = false;
  app.dataset.page = state.page;
  app.innerHTML = `<div class="product-content" ${state.dialog ? "inert" : ""}>${views[state.page]()}</div>${state.dialog ? views.dialog() : ""}`;
  bind();
  if ($(".scroll-screen")) $(".scroll-screen").scrollTop = scrollTop;
  if (
    activeStream &&
    state.page === "camera" &&
    state.mode === "live" &&
    $("#camera-video")
  ) {
    $("#camera-video").srcObject = activeStream;
    $("#camera-video")
      .play()
      .catch(() => {});
  }
  if (state.page === "editor") updatePreview();
}
async function go(page, push = true) {
  state.resetScroll = true;
  if (page === "camera" && state.mode === "live") state.mode = "idle";
  if (page === "detail" && ["camera", "album"].includes(state.page))
    state.returnPage = state.page;
  if (state.page === "editor" && page !== "editor") renderSeq++;
  if (page !== "camera") stopCamera();
  state.page = page;
  state.sheet = false;
  state.dialog = null;
  if (push && history.state?.page !== page)
    history.pushState({ page }, "", "#" + page);
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
  state.editTab = "brightness";
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
    if (name === "adjust-tab") {
      state.editTab = el.dataset.tab;
      render();
    }
    if (name === "photo-back") await go(state.returnPage);
    if (name === "close-dialog") {
      state.dialog = null;
      render();
    }
    if (name === "confirm-discard") {
      state.dialog = null;
      await go("detail");
    }
    if (name === "confirm-delete") {
      await deletePhoto(state.current.id);
      await go("album");
      toast("照片已删除");
    }
    if (name === "dialog-download") {
      state.dialog = null;
      render();
      await action("download", el);
    }
    if (name === "camera") {
      stopCamera();
      if (state.mode === "live") state.mode = "idle";
      await go("camera");
    }
    if (name === "simulate") {
      stopCamera();
      state.mode = "sim";
      state.scene = "人像";
      state.template = "thirds";
      state.page = "camera";
      state.sheet = false;
      state.dialog = null;
      history.replaceState({ page: "camera" }, "", "#camera");
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
      state.sheet = !state.sheet;
      render();
      $('[data-action="templates"]')?.focus();
    }
    if (name === "close-sheet") {
      state.sheet = false;
      render();
    }
    if (name === "select-template") {
      state.template = el.dataset.template;
      state.grid = true;
      render();
      document.querySelector(`[data-template="${state.template}"]`)?.focus();
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
    if (name === "detail") {
      if (
        state.page === "editor" &&
        JSON.stringify(state.adjust) !== JSON.stringify(defaults)
      ) {
        state.dialog = "discard";
        render();
      } else await go("detail");
    }
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
      el.textContent = "保存中…";
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
      } else {
        state.dialog = "share";
        render();
      }
    }
    if (name === "delete") {
      state.dialog = "delete";
      render();
    }
    if (name === "about") {
      state.dialog = "about";
      render();
    }
  } catch (e) {
    console.error(e);
    toast("操作未完成：" + e.message);
  }
}
function bind() {
  app.querySelectorAll("[data-action]").forEach((el) =>
    el.addEventListener("click", (e) => {
      if (
        (el.classList.contains("sheet-backdrop") ||
          el.classList.contains("dialog-backdrop")) &&
        e.target !== el
      )
        return;
      action(el.dataset.action, el);
    }),
  );
  $(".action-sheet")?.addEventListener("click", (e) => e.stopPropagation());
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
  if (e.key === "Escape" && state.dialog) {
    state.dialog = null;
    render();
    return;
  }
  if (e.key === "Escape" && state.sheet) {
    state.sheet = false;
    render();
  }
  if (state.dialog && e.key === "Tab") {
    const focus = [
      ...$(state.dialog ? ".action-sheet" : ".sheet").querySelectorAll(
        "button:not([disabled])",
      ),
    ];
    if (e.shiftKey && document.activeElement === focus[0]) {
      e.preventDefault();
      focus.at(-1).focus();
    } else if (!e.shiftKey && document.activeElement === focus.at(-1)) {
      e.preventDefault();
      focus[0].focus();
    }
  }
});
history.replaceState({ page: "camera" }, "", "#camera");
window.addEventListener("popstate", async (e) => {
  if (state.dialog) {
    state.sheet = false;
    state.dialog = null;
    render();
    history.pushState({ page: state.page }, "", "#" + state.page);
    return;
  }
  if (
    state.page === "editor" &&
    JSON.stringify(state.adjust) !== JSON.stringify(defaults)
  ) {
    state.dialog = "discard";
    history.pushState({ page: "editor" }, "", "#editor");
    render();
    return;
  }
  const page = e.state?.page || "camera";
  await go(
    ["detail", "editor", "diagnosis"].includes(page) && !state.current
      ? "album"
      : page,
    false,
  );
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
