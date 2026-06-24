import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptsDir, "..");
const cliDist = path.join(repoRoot, "packages", "cli", "dist");
const coreDist = path.join(repoRoot, "packages", "core", "dist");
const bundledCore = path.join(cliDist, "vendor", "core");
const programPath = path.join(cliDist, "program.js");

await fs.access(path.join(coreDist, "index.js"));
await fs.rm(bundledCore, { recursive: true, force: true });
await copyDirectory(coreDist, bundledCore);
await rewriteCoreImport(programPath);

async function copyDirectory(source, destination) {
  await fs.mkdir(destination, { recursive: true });
  const entries = await fs.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, destinationPath);
    } else if (entry.isFile()) {
      await fs.copyFile(sourcePath, destinationPath);
    }
  }
}

async function rewriteCoreImport(filePath) {
  const source = await fs.readFile(filePath, "utf8");
  const updated = source.replaceAll('from "@mcp-doctor/core"', 'from "./vendor/core/index.js"');

  if (source === updated) {
    throw new Error(`Expected @mcp-doctor/core import in ${filePath}.`);
  }

  await fs.writeFile(filePath, updated, "utf8");
}
