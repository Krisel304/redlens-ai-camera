import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
const root = path.resolve(process.env.SERVE_DIST ? "dist" : ".");
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};
http
  .createServer(async (req, res) => {
    try {
      let url = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      if (url.startsWith("/assets/") && !process.env.SERVE_DIST)
        url = "/public" + url;
      const file = path.resolve(
        root,
        "." + (url === "/" ? "/index.html" : url),
      );
      if (!file.startsWith(root + path.sep)) throw Error();
      res.setHeader(
        "Content-Type",
        types[path.extname(file)] || "application/octet-stream",
      );
      res.end(await readFile(file));
    } catch {
      res.statusCode = 404;
      res.end("Not found");
    }
  })
  .listen(4173, "127.0.0.1", () => console.log("http://localhost:4173"));
