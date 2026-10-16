export const samples = [
  {
    id: "snowboard",
    name: "在雪场，追一束光",
    scene: "人像",
    location: "环境人像 · 冬日雪场",
  },
  {
    id: "landscape",
    name: "山与水之间",
    scene: "风景",
    location: "自然风景 · 山水层次",
  },
  {
    id: "sunset",
    name: "日落之前",
    scene: "风景",
    location: "光影练习 · 雪原日落",
  },
  {
    id: "durian",
    name: "一口热带",
    scene: "静物",
    location: "美食静物 · 色彩细节",
  },
].map((x) => ({ ...x, url: `/assets/${x.id}.webp`, source: "样例照片" }));
export const templates = {
  人像: [
    {
      id: "thirds",
      name: "三分构图",
      desc: "把主体放在右侧交点，让视线有延伸的空间。",
      tag: "保留环境感",
    },
    {
      id: "center",
      name: "中心构图",
      desc: "让人物位于画面中心，突出主体与情绪。",
      tag: "聚焦人物",
    },
    {
      id: "frame",
      name: "留白构图",
      desc: "给人物上方留出空间，让画面更轻盈。",
      tag: "营造呼吸感",
    },
  ],
  风景: [
    {
      id: "thirds",
      name: "三分构图",
      desc: "将地平线放在三分线上，平衡天空与地面。",
      tag: "平衡层次",
    },
    {
      id: "center",
      name: "对称构图",
      desc: "寻找中轴线，让山水呈现安静的秩序。",
      tag: "秩序与平衡",
    },
    {
      id: "diagonal",
      name: "对角构图",
      desc: "沿对角线安排景物，引导视线进入画面。",
      tag: "延伸空间",
    },
  ],
  静物: [
    {
      id: "center",
      name: "中心构图",
      desc: "将食物或物件置于中央，强化细节和质感。",
      tag: "突出质感",
    },
    {
      id: "thirds",
      name: "三分构图",
      desc: "把物件放在交点，给周围环境留出空间。",
      tag: "日常叙事",
    },
    {
      id: "diagonal",
      name: "对角构图",
      desc: "让物件沿对角线延展，增加画面动势。",
      tag: "制造动势",
    },
  ],
};
