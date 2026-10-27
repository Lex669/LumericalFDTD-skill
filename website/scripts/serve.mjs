import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../dist/", import.meta.url));
const base = "/LumericalFDTD-skill/";
const port = Number(process.env.PORT || 4173);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};
const server = http.createServer(async (request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }
  if (pathname === "/" || pathname === base.slice(0, -1)) {
    response.writeHead(302, { Location: base }).end();
    return;
  }
  if (!pathname.startsWith(base)) {
    response.writeHead(404).end("Not found");
    return;
  }
  const target = path.resolve(
    root,
    pathname.slice(base.length) || "index.html",
  );
  const relative = path.relative(root, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    response.writeHead(403).end("Forbidden");
    return;
  }
  try {
    const data = await readFile(target);
    response.writeHead(200, {
      "Content-Type": mime[path.extname(target)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(data);
  } catch {
    response.writeHead(404).end("Not found. Run npm run build first.");
  }
});
server.listen(port, "127.0.0.1", () =>
  console.log(`Local: http://localhost:${port}${base}`),
);
