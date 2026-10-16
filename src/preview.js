const buttons = [...document.querySelectorAll("[data-view]")];
const query = new URLSearchParams(location.search);
let saved;
try {
  saved = localStorage.getItem("redlens-preview-mode");
} catch {}
function selectView(mode) {
  if (!["phone", "desktop"].includes(mode)) mode = "phone";
  document.documentElement.dataset.view = mode;
  buttons.forEach((button) =>
    button.setAttribute("aria-pressed", String(button.dataset.view === mode)),
  );
  try {
    localStorage.setItem("redlens-preview-mode", mode);
  } catch {}
  const url = new URL(location.href);
  url.searchParams.set("view", mode);
  history.replaceState(null, "", url);
}
buttons.forEach((button) =>
  button.addEventListener("click", () => selectView(button.dataset.view)),
);
// Resize the same app frame: mode changes preserve the photo, editor and camera session.
selectView(
  query.get("view") ||
    (matchMedia("(max-width: 600px)").matches ? "phone" : saved) ||
    "phone",
);
