const paths = {
  camera: '<path d="M8 5l2-2h4l2 2h4v15H4V5z"/><circle cx="12" cy="12" r="4"/>',
  spark:
    '<path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/><path d="M20 2v4M18 4h4"/>',
  grid: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',
  album:
    '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1"/><path d="M3 17l6-6 4 4 3-3 5 5"/>',
  arrow: '<path d="M15 5l-7 7 7 7"/>',
  right: '<path d="M9 5l7 7-7 7"/>',
  upload: '<path d="M12 16V3m-5 5l5-5 5 5M4 15v6h16v-6"/>',
  switch: '<path d="M3 8h15l-4-4M21 16H6l4 4"/>',
  check: '<path d="M5 12l4 4L19 6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  download: '<path d="M12 3v13m-5-5l5 5 5-5M4 17v4h16v-4"/>',
  edit: '<path d="M4 7h16M4 17h16M8 3v8M16 13v8"/>',
  undo: '<path d="M8 4L3 9l5 5M3 9h10a7 7 0 017 7"/>',
  redo: '<path d="M16 4l5 5-5 5m5-5H11a7 7 0 00-7 7"/>',
  rotate: '<path d="M4 8V3m0 5h5M4 8a9 9 0 111 10"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3M4 4l2 2M18 18l2 2M4 20l2-2M18 6l2-2"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
  share: '<path d="M12 16V2m-4 4l4-4 4 4M5 10H3v12h18V10h-2"/>',
};
export const icon = (name, cls = "") =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.spark}</svg>`;
