import fs from "fs";
import http from "http";
import path from "path";

const PORT = Number(process.env.PORT) || 3000;
const ROOT_DIR = process.cwd();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const ALLOWED_FILES = new Set([
  "index.html",
  "styles.css",
  "app.js",
  "assets/prmsc_office_hero.jpg",
]);

const server = http.createServer((req, res) => {
  const urlPath = (req.url || "/").split("?")[0];
  const relPath = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");

  if (!ALLOWED_FILES.has(relPath)) {
    res.writeHead(404, {"Content-Type": "text/plain; charset=utf-8"});
    res.end("Not Found");
    return;
  }

  const resolved = path.resolve(ROOT_DIR, relPath);
  if (!resolved.startsWith(ROOT_DIR + path.sep)) {
    res.writeHead(403, {"Content-Type": "text/plain; charset=utf-8"});
    res.end("Forbidden");
    return;
  }

  fs.readFile(resolved, (err, content) => {
    if (err) {
      res.writeHead(404, {"Content-Type": "text/plain; charset=utf-8"});
      res.end("File not found");
      return;
    }
    const ext = path.extname(resolved).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(content);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`PRMSC static site listening on http://localhost:${PORT}`);
});
