import fs from "node:fs/promises";
import path from "node:path";

const [directory, type] = process.argv.slice(2);

if (!directory || !type) {
  throw new Error("Usage: node write-package-type.mjs <directory> <type>");
}

const target = path.resolve(process.cwd(), directory);
await fs.mkdir(target, { recursive: true });
await fs.writeFile(path.join(target, "package.json"), `${JSON.stringify({ type }, null, 2)}\n`, "utf8");
