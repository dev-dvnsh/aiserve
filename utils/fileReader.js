import fs from "fs";

export function readFile(path) {
  return fs.readFileSync(path, "utf8");
}
