import fs from "node:fs/promises";
import path from "node:path";

const cwd = process.cwd();

for (const entry of process.argv.slice(2)) {
  const target = path.resolve(cwd, entry);
  const relative = path.relative(cwd, target);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to remove path outside the package: ${entry}`);
  }

  await fs.rm(target, { recursive: true, force: true });
}
