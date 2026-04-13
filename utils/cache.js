import fs from "fs";
import crypto from "crypto";
import path from "path";

const cacheDir = ".aiserve/cache";

export function getFileHash(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

export function getCachedHTML(hash) {
  const file = path.join(cacheDir, `${hash}.html`);

  if (fs.existsSync(file)) {
    return fs.readFileSync(file, "utf8");
  }

  return null;
}

export function saveCache(hash, html) {
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  const file = path.join(cacheDir, `${hash}.html`);
  fs.writeFileSync(file, html);
}
