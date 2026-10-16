# RedLens AI Camera · 交付记录

- 正式访问：https://redlens-ai-camera.vercel.app
- 公开源码：https://github.com/Krisel304/redlens-ai-camera
- 本地源码：/Users/kairos/Documents/ChatGPT/个人项目/redlens-ai-camera
- 版本：v1.4.1，2026-10-16。
- 发布方式：GitHub main → Vercel 自动构建；构建命令 npm run build，产物 dist。
- 首次部署：Vercel 页面已显示 Congratulations，部署地址 redlens-ai-camera-bopqm6wjm-k-k-k1.vercel.app。

本地单元测试、浏览器模拟拍摄→诊断→编辑→保存→刷新重开、手机尺寸布局测试通过。浏览器模拟摄像头取流和镜头切换通过；真实手机硬件仍需用户在 HTTPS 网站授权相机后验证。

当前分析为本地像素算法与构图规则，没有云端视觉模型；不会自动理解人物、意图和审美。重要照片请下载保存，清理站点数据会清空本地相册。

v1.4.0：主站直接进入手机应用，取消 v1.3.0 的设备展示外壳。手机页面、内部抽屉、底部操作与返回逻辑重新设计，既有个人照片保留。

v1.4.1：构图选择栏位于取景区下方，无模板弹窗/遮罩，展开时继续操作快门和相机；详细指导移出取景画面。
