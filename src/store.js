let db;
function open() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);
    const req = indexedDB.open("redlens-ai-camera", 1);
    req.onupgradeneeded = () =>
      req.result.createObjectStore("photos", { keyPath: "id" });
    req.onsuccess = () => {
      db = req.result;
      resolve(db);
    };
    req.onerror = () => reject(req.error);
  });
}
async function run(mode, fn) {
  const d = await open();
  return new Promise((resolve, reject) => {
    const tx = d.transaction("photos", mode);
    const req = fn(tx.objectStore("photos"));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
export const listPhotos = async () =>
  ((await run("readonly", (s) => s.getAll())) || []).sort(
    (a, b) => b.created - a.created,
  );
export const savePhoto = (p) => run("readwrite", (s) => s.put(p));
export const deletePhoto = (id) => run("readwrite", (s) => s.delete(id));
