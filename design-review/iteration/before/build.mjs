import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const site = fileURLToPath(new URL("../", import.meta.url));
const repo = path.resolve(site, "..");
const output = path.join(site, "dist");
const readme = await readFile(path.join(repo, "README.md"), "utf8");
const manifest = JSON.parse(
  await readFile(path.join(repo, ".codex-plugin/plugin.json"), "utf8"),
);
const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
const inline = (value) =>
  escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

function installation(heading) {
  const content = readme.split(`### ${heading}`)[1]?.split("\n### ")[0];
  const commands = content?.match(/```bash\r?\n([\s\S]*?)```/)?.[1];
  if (!commands)
    throw new Error(`Missing installation instructions: ${heading}`);
  return commands
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith("#"))
    .join("\n");
}

const changelog = readme.split("## 更新日志")[1]?.split("\n## ")[0];
if (!changelog) throw new Error("README changelog section is missing.");
const releases = [
  ...changelog.matchAll(
    /^### (\d+\.\d+\.\d+) · ([^\n—]+) — ([^\n]+)\r?\n([\s\S]*?)(?=^### |$(?![\s\S]))/gm,
  ),
];
if (!releases.length)
  throw new Error("No semantic-version changelog entries found.");
if (releases[0][1] !== manifest.version)
  throw new Error("Manifest version and latest README changelog do not match.");
const releaseHtml = releases
  .map(([, version, date, title, body], index) => {
    const items = [...body.matchAll(/^- (.+)$/gm)]
      .map((match) => `<li>${inline(match[1].trim())}</li>`)
      .join("");
    const isoDate = date.trim().match(/^\d{4}-\d{2}-\d{2}/)?.[0];
    return `<article class="changelog-entry"><div class="release-meta"><h3>v${escapeHtml(version)}</h3>${index === 0 ? '<span class="latest-badge">最新版本</span>' : ""}<time${isoDate ? ` datetime="${isoDate}"` : ""}>${escapeHtml(date.trim())}</time></div><h4>${escapeHtml(title.trim())}</h4><ul>${items}</ul></article>`;
  })
  .join("\n");

const replacements = {
  VERSION: escapeHtml(manifest.version),
  INSTALL_CLAUDE: escapeHtml(installation("Claude Code")),
  INSTALL_CODEX: escapeHtml(installation("Codex CLI")),
  CHANGELOG: releaseHtml,
};
let html = await readFile(path.join(site, "index.html"), "utf8");
for (const [name, value] of Object.entries(replacements))
  html = html.replaceAll(`{{${name}}}`, value);
if (/\{\{[A-Z_]+\}\}/.test(html))
  throw new Error("Unresolved template placeholder.");

// Validate all page fragment links and tab/clipboard references before deployment.
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
if (new Set(ids).size !== ids.length) throw new Error("Duplicate HTML ids.");
for (const reference of html.matchAll(
  /(?:href="#([^" ]+)"|aria-controls="([^"]+)"|aria-labelledby="([^"]+)"|data-copy="([^"]+)")/g,
)) {
  const referencedIds = reference.slice(1).find(Boolean).split(/\s+/);
  for (const id of referencedIds) {
    if (!ids.includes(id)) throw new Error(`Broken element reference: ${id}`);
  }
}
await mkdir(path.join(output, "assets"), { recursive: true });
await writeFile(path.join(output, "index.html"), html);
for (const name of ["styles.css", "app.js"])
  await copyFile(path.join(site, name), path.join(output, name));
await copyFile(
  path.join(site, "assets/mark.svg"),
  path.join(output, "assets/mark.svg"),
);
await writeFile(path.join(output, ".nojekyll"), "");
console.log(
  `Built LumericalFDTD v${manifest.version} → docs/dist (${releases.length} releases, validated page references)`,
);
