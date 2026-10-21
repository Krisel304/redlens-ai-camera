export function createViews({
  state: s,
  btn: b,
  icon: i,
  esc,
  grid,
  samples,
  templates,
  template,
}) {
  const top = (title, back = "album", right = "") =>
    `<header class="screen-header">${b(back, i("arrow"), "icon-btn", `aria-label="返回${back === "camera" ? "相机" : "照片"}"`)}<h1>${title}</h1><div class="header-action">${right || '<span class="header-spacer"></span>'}</div></header>`;
  const note = (text) => `<p class="capability-note">${i("info")}${text}</p>`;
  function camera() {
    const t = template();
    const scenes = ["智能", "人像", "风景", "静物"]
      .map((x) =>
        b(
          "scene",
          (x === "智能" ? i("spark") : "") + x,
          `scene ${s.scene === x ? "selected" : ""}`,
          `data-scene="${x}" aria-pressed="${s.scene === x}" ${x === "智能" && !s.ai ? "disabled" : ""}`,
        ),
      )
      .join("");
    const ai = `<div class="ai-control"><span>${i("spark")} AI</span>${b("ai", "<span></span>", `toggle ${s.ai ? "on" : ""}`, `role="switch" aria-label="AI 辅助" aria-checked="${s.ai}"`)}</div>`;
    return `<header class="camera-header"><div class="wordmark">RedLens<span>AI CAMERA</span></div><div class="camera-toolbar">${ai}${b("simulate", i("album") + "<span>体验模拟拍摄</span>", "simulate")}</div></header>
      <section class="camera-screen" aria-label="相机">
        <div class="viewfinder ${s.mode === "idle" ? "idle" : ""}">
          ${s.mode === "live" ? '<video id="camera-video" autoplay playsinline muted></video>' : `<img class="scene-image" src="${samples[0].url}" alt="${s.mode === "sim" ? "模拟取景：雪场环境人像" : "滑雪人像样例预览"}">`}
          ${s.mode === "idle" ? `<div class="camera-empty"><span class="empty-camera-icon">${i("camera")}</span><span class="eyebrow">REDLENS AI CAMERA</span><h2>专注眼前，自在拍摄。</h2><p id="camera-status">开启相机，捕捉此刻。<br>也可以先用样例体验。</p>${b("start-camera", i("camera") + " 开启相机", "primary")}${b("simulate", "先体验模拟拍摄 " + i("right"), "text-btn")}</div>` : `<div class="viewfinder-top"><span class="mode-label"><span class="live-dot"></span>${s.mode === "sim" ? "模拟体验" : "实时取景"}</span>${b("grid", i("grid"), `view-btn ${s.grid ? "on" : ""}`, `aria-label="切换构图线" aria-pressed="${s.grid}"`)}</div>${s.grid ? grid() : ""}<div class="viewfinder-bottom"><span>1×</span><span>原图比例</span></div>`}
        </div>
        <div class="camera-bottom">
          <div class="scene-tabs" aria-label="拍摄场景">${scenes}</div>
          ${s.sheet ? sheet() : ""}
          ${s.mode !== "idle" ? `<div class="composition-hint" role="status" aria-live="polite"><b>${t.name}</b><span>${s.ai ? t.desc : "手动构图 · 按所选模板取景"}</span></div>` : ""}
          <div class="shutter-row">
            ${b("album", (s.photos[0] ? `<img src="${s.photos[0].url}" alt="最近拍摄">` : i("album")) + "<small>相册</small>", "album-control", 'aria-label="打开相册"')}
            <div class="shutter-wrap">${b("capture", "<span></span>", "shutter", `aria-label="拍照" ${s.mode === "idle" ? "disabled" : ""}`)}<span>照片</span></div>
            ${b("templates", i("grid") + "<small>构图模板</small>", `template-control ${s.sheet ? "active" : ""}`, `aria-expanded="${s.sheet}" aria-controls="template-dock"`)}
          </div>
          <div class="camera-foot">${s.mode === "sim" ? b("start-camera", i("switch") + " 真实相机", "text-btn") : s.mode === "live" ? b("switch-camera", i("switch") + " 切换镜头", "text-btn") : b("upload", i("upload") + " 导入照片", "text-btn")}${b("about", "本地辅助 " + i("info"), "text-btn")}</div>
        </div>
      </section>`;
  }
  function album() {
    return `${top("相册", "camera", b("upload", i("upload"), "icon-btn", 'aria-label="导入照片"'))}<section class="scroll-screen album-page"><div class="page-intro"><span class="eyebrow">YOUR MOMENTS, YOUR STORIES</span><h2>把值得的瞬间，留下来。</h2><p>拍摄、发现，再创作。</p></div><section class="samples-section"><div class="samples-heading">${b("expand", `<strong>灵感样例 <span>4</span></strong>${i("chevron")}`, s.expanded ? "expanded" : "", `aria-expanded="${s.expanded}"`)}<div>${b("sample-prev", i("arrow"), "icon-btn", 'aria-label="上一张样例"')}${b("sample-next", i("right"), "icon-btn", 'aria-label="下一张样例"')}</div></div>${s.expanded ? `<div class="sample-strip">${samples.map((p) => b("sample", `<img src="${p.url}" alt="${p.name}" draggable="false"><div><small>${p.scene} · 样例</small><b>${p.name}</b></div>`, "sample-photo", `data-id="${p.id}"`)).join("")}</div>` : ""}</section><div class="section-label"><h3>我的照片 <span>${s.photos.length}</span></h3><span>仅此设备可见</span></div>${s.photos.length ? `<div class="photo-grid">${s.photos.map((p) => b("photo", `<div class="photo-thumb"><img src="${p.url}" alt="${esc(p.name)}">${p.edited ? "<span>编辑版本</span>" : ""}</div><b>${esc(p.name)}</b><small>${p.source} · ${new Date(p.created).toLocaleDateString("zh-CN")}</small>`, "photo-tile", `data-id="${p.id}"`)).join("")}</div>` : `<div class="empty-album">${i("album")}<h3>让第一张好照片发生</h3><p>拍一张，或导入一张喜欢的照片。</p>${b("camera", "去拍摄 " + i("right"), "primary")}${b("upload", "从设备导入", "text-btn")}</div>`}${note("样例不会计入我的照片。个人照片仅保存在当前浏览器，重要作品请及时下载。")}</section><nav class="bottom-nav">${b("camera", i("camera") + " 拍摄", "")}${b("album", i("album") + " 相册", "selected")}</nav>`;
  }
  function detail() {
    const p = s.current;
    return `${top("照片", "photo-back", b("share", i("share"), "icon-btn", 'aria-label="分享照片"'))}<section class="scroll-screen detail-page"><div class="photo-stage"><img src="${p.url}" alt="${esc(p.name)}"></div><div class="detail-info"><div class="section-label"><span>${p.source || "原始照片"}</span><span>${p.edited ? "已编辑 · 原图保留" : "未编辑"}</span></div><h2>${esc(p.name)}</h2><p>${p.location || "属于你的摄影瞬间"}</p><div class="diagnose-promo"><span class="assistant-symbol">${i("spark")}</span><div><h3>发现照片的更多可能</h3><p>看懂光影与色彩，让下一张更好。</p></div>${i("right")}</div></div></section><div class="detail-bottom"><div class="detail-primary">${b("edit", i("edit") + " 手动编辑", "secondary")}${b("diagnose", i("spark") + " 开始照片诊断", "primary")}</div><div class="detail-actions">${b("download", i("download") + " 下载照片", "text-btn")}${!samples.some((x) => x.id === p.id) ? b("delete", i("trash") + " 删除", "text-btn danger") : b("about", i("info") + " 样例说明", "text-btn")}</div></div>`;
  }
  function diagnosis() {
    const a = s.analysis;
    return `${top("照片诊断", "detail", b("edit", "编辑", "header-text"))}<section class="scroll-screen diagnosis-page"><div class="diagnosis-context"><img src="${s.current.url}" alt="当前分析照片"><div><small>针对当前照片的分析</small><h2>${esc(s.current.name)}</h2><span>本地像素分析 · 非云端模型</span></div></div><div class="score-row"><div class="score-circle" style="--score:${a.total}%"><strong>${a.total}<small>/ 100</small></strong></div><div><span class="eyebrow">PHOTO INSIGHTS</span><h2>看见照片里的可能</h2><p>像素指标参考分，不代表审美评价</p></div></div><div class="scores">${a.scores.map((x) => `<div><span>${x.name}</span><div><i style="width:${x.value}%"></i></div><b>${x.value}</b></div>`).join("")}</div><div class="highlight">${i("sun")}<p>${a.highlight}</p></div><div class="section-label"><h3>可以尝试的调整</h3><span>${a.issues.length} 项建议</span></div><div class="issues">${a.issues.length ? a.issues.map((x) => `<label class="issue"><input type="checkbox" data-issue="${x.id}" ${s.selected.has(x.id) ? "checked" : ""}><span><b>${x.title}</b><small>${x.detail}</small></span></label>`).join("") : '<p class="balanced">亮度与色彩处于参考范围，可以进入编辑探索喜欢的风格。</p>'}</div>${note("建议来自实际像素统计，不判断人物表情、拍摄意图或审美，也无法恢复过曝丢失的细节。")}</section><div class="sticky-action">${b("apply", "应用所选建议 " + i("right"), "primary wide")}</div>`;
  }
  function editor() {
    return `${top("编辑照片", "detail", b("save", s.busy ? "保存中…" : "保存", "header-text", s.busy ? "disabled" : ""))}<section class="editor-screen"><div class="edit-stage"><canvas id="edit-canvas"></canvas><span class="edit-label">${s.adjust.crop === "original" ? "原始画幅" : s.adjust.crop === "square" ? "1 : 1" : "3 : 4"}</span>${b("compare", "按住对比", "compare-button")}</div><div class="editor-tools"><div class="edit-history">${b("undo", i("undo"), "icon-btn", `aria-label="撤销" ${s.historyIndex === 0 ? "disabled" : ""}`)}${b("redo", i("redo"), "icon-btn", `aria-label="重做" ${s.historyIndex === s.history.length - 1 ? "disabled" : ""}`)}<span></span>${b("reset", "重置", "text-btn")}${b("rotate", i("rotate"), "icon-btn", 'aria-label="旋转90度"')}</div><div class="adjustment-tabs" role="group" aria-label="调整项目">${[
      ["brightness", "曝光"],
      ["contrast", "对比度"],
      ["saturation", "饱和度"],
      ["warmth", "色温"],
    ]
      .map(([key, name]) =>
        b(
          "adjust-tab",
          `<span>${name}</span><small>${s.adjust[key] > 0 ? "+" : ""}${s.adjust[key]}</small>`,
          s.editTab === key ? "selected" : "",
          `data-tab="${key}" aria-pressed="${s.editTab === key}"`,
        ),
      )
      .join(
        "",
      )}</div><label class="slider-label"><span>${{ brightness: "曝光", contrast: "对比度", saturation: "饱和度", warmth: "色温" }[s.editTab]}<b id="value-${s.editTab}">${s.adjust[s.editTab]}</b></span><input type="range" min="-60" max="60" value="${s.adjust[s.editTab]}" data-adjust="${s.editTab}" aria-label="${{ brightness: "曝光", contrast: "对比度", saturation: "饱和度", warmth: "色温" }[s.editTab]}"></label><div class="crop-row"><span>画幅</span><div class="crop-options">${[
      ["original", "原始"],
      ["portrait", "3 : 4"],
      ["square", "1 : 1"],
    ]
      .map(([id, name]) =>
        b(
          "crop",
          name,
          s.adjust.crop === id ? "selected" : "",
          `data-crop="${id}"`,
        ),
      )
      .join(
        "",
      )}</div></div><p class="editor-note">保存为新版本，原图始终保留。</p></div></section>`;
  }
  function sheet() {
    return `<section class="template-dock" id="template-dock" aria-label="构图模板"><header><span>选择构图 <small>实时预览 · 可直接拍照</small></span>${b("close-sheet", i("close"), "icon-btn", 'aria-label="关闭模板"')}</header><div class="template-rail" role="group" aria-label="当前场景构图">${templates[s.scene].map((t, k) => b("select-template", `<span class="dock-mini">${grid(t.id)}<span class="subject-dot"></span></span><span>${t.name}</span>${s.ai && k === 0 ? "<small>推荐</small>" : ""}`, `dock-option ${s.template === t.id ? "selected" : ""}`, `data-template="${t.id}" aria-pressed="${s.template === t.id}"`)).join("")}</div></section>`;
  }
  function dialog() {
    const type = s.dialog;
    let title, body, actions;
    if (type === "delete") {
      title = "删除这张照片？";
      body = "照片会从此设备的相册移除，此操作无法撤销。";
      actions =
        b("confirm-delete", "删除照片", "danger-action") +
        b("close-dialog", "取消", "cancel-action");
    } else if (type === "discard") {
      title = "放弃这次调整？";
      body = "尚未保存的修改会丢失，原图不会受到影响。";
      actions =
        b("confirm-discard", "放弃修改", "danger-action") +
        b("close-dialog", "继续编辑", "cancel-action");
    } else if (type === "share") {
      title = "把这个瞬间带走";
      body =
        "当前浏览器不支持系统图片分享。可以先下载照片，再从相册发送给朋友。";
      actions =
        b("dialog-download", i("download") + " 下载照片", "primary wide") +
        b("close-dialog", "取消", "cancel-action");
    } else {
      title = "RedLens AI Camera";
      body =
        "构图建议来自内置摄影规则，诊断来自本地像素计算，目前没有接入云端视觉模型。\n\n个人照片只保存在此浏览器，不会上传。清除站点数据会丢失照片，请下载重要作品。";
      actions = b("close-dialog", "知道了", "primary wide");
    }
    return `<div class="dialog-backdrop" data-action="close-dialog"><section class="action-sheet" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div class="sheet-handle"></div><div class="action-sheet-copy"><span class="dialog-symbol">${i(type === "delete" ? "trash" : type === "discard" ? "edit" : type === "share" ? "share" : "spark")}</span><h2 id="dialog-title">${title}</h2><p>${body}</p></div>${actions}</section></div>`;
  }
  return { camera, album, detail, diagnosis, editor, sheet, dialog };
}
