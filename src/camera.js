let stream = null,
  generation = 0;
export function stopCamera() {
  generation++;
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
}
export async function startCamera(video, facing = "environment") {
  stopCamera();
  const gen = generation;
  if (!window.isSecureContext)
    throw Error("当前连接不安全，请通过 HTTPS 或 localhost 打开");
  if (!navigator.mediaDevices?.getUserMedia)
    throw Error("浏览器不支持相机，请使用 Safari 或 Chrome");
  let timer;
  try {
    const pending = navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: facing }, width: { ideal: 1920 } },
      audio: false,
    });
    pending.then(
      (s) => {
        if (gen !== generation) s.getTracks().forEach((t) => t.stop());
      },
      () => {},
    );
    stream = await Promise.race([
      pending,
      new Promise(
        (_, r) =>
          (timer = setTimeout(() => {
            generation++;
            r(Error("相机授权等待超时，请检查权限后重试"));
          }, 10000)),
      ),
    ]);
    if (gen !== generation) {
      stream.getTracks().forEach((t) => t.stop());
      throw Error("相机请求已取消");
    }
    video.srcObject = stream;
    await video.play();
  } catch (e) {
    const errors = {
      NotAllowedError: "相机权限未开启，请在浏览器设置中允许访问",
      NotFoundError: "没有找到摄像头，可以先体验模拟拍摄",
      NotReadableError: "相机正被其他应用占用，请关闭后重试",
    };
    throw Error(errors[e.name] || e.message);
  } finally {
    clearTimeout(timer);
  }
}
export function capture(video) {
  if (!video.videoWidth) throw Error("相机还未就绪");
  const c = document.createElement("canvas");
  c.width = video.videoWidth;
  c.height = video.videoHeight;
  c.getContext("2d").drawImage(video, 0, 0);
  return c.toDataURL("image/jpeg", 0.92);
}
