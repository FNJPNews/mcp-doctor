import path from "node:path";
import { builtinModules, createRequire } from "node:module";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptsDir, "..");
const cliPackageDir = path.join(repoRoot, "packages", "cli");
const cliEntry = path.join(cliPackageDir, "src", "cli.ts");
const indexEntry = path.join(cliPackageDir, "src", "index.ts");
const coreEntry = path.join(repoRoot, "packages", "core", "dist", "index.js");
const cliOutfile = path.join(cliPackageDir, "dist", "cli.js");
const indexOutfile = path.join(cliPackageDir, "dist", "index.js");
const nodeBuiltins = builtinModules.flatMap((moduleName) => [moduleName, `node:${moduleName}`]);
const require = createRequire(import.meta.url);
const esmRequireBanner = [
  'import { createRequire as __mcpDoctorCreateRequire } from "node:module";',
  "const require = __mcpDoctorCreateRequire(import.meta.url);",
].join("\n");
const workspaceNamespace = "mcp-doctor-workspace-file";

await ensureCoreBuildExists();

const workspaceCoreAlias = {
  name: "workspace-file-loader",
  setup(buildContext) {
    buildContext.onResolve({ filter: /.*/ }, async (args) => {
      if (isNodeBuiltin(args.path)) {
        return { path: args.path, external: true };
      }

      if (args.path === "@mcp-doctor/core") {
        return { path: coreEntry, namespace: workspaceNamespace };
      }

      if (args.kind === "entry-point") {
        return { path: path.resolve(args.path), namespace: workspaceNamespace };
      }

      const resolveDir = args.resolveDir || cliPackageDir;
      const resolvedPath = await resolveImport(args.path, resolveDir);
      return { path: resolvedPath, namespace: workspaceNamespace };
    });

    buildContext.onLoad({ filter: /.*/, namespace: workspaceNamespace }, async (args) => {
      const contents = await fs.readFile(args.path, "utf8");
      return {
        contents,
        loader: loaderForPath(args.path),
        resolveDir: path.dirname(args.path),
      };
    });
  },
};

const shared = {
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  sourcemap: false,
  logLevel: "warning",
  plugins: [workspaceCoreAlias],
  write: false,
};

await writeBundledOutput(cliOutfile, {
  ...shared,
  entryPoints: [cliEntry],
  outfile: "cli.js",
  banner: {
    js: `#!/usr/bin/env node\n${esmRequireBanner}`,
  },
});

await writeBundledOutput(indexOutfile, {
  ...shared,
  entryPoints: [indexEntry],
  outfile: "index.js",
  banner: {
    js: esmRequireBanner,
  },
});

async function ensureCoreBuildExists() {
  try {
    await fs.access(coreEntry);
  } catch {
    throw new Error("Core build output is missing. Run the core build before bundling the CLI.");
  }
}

async function writeBundledOutput(outfile, options) {
  const result = await build(options);
  const outputFile = result.outputFiles[0];
  if (!outputFile) {
    throw new Error(`esbuild did not produce output for ${outfile}.`);
  }

  await fs.mkdir(path.dirname(outfile), { recursive: true });
  await fs.writeFile(outfile, outputFile.text, "utf8");
}

async function resolveImport(specifier, resolveDir) {
  if (specifier.startsWith(".") || path.isAbsolute(specifier)) {
    const resolved = path.resolve(resolveDir, specifier);
    const tsResolved = await resolveTypeScriptSourceImport(resolved);
    if (tsResolved) {
      return tsResolved;
    }
  }

  return require.resolve(specifier, { paths: [resolveDir] });
}

async function resolveTypeScriptSourceImport(resolvedPath) {
  const candidates = [];

  if (resolvedPath.endsWith(".js")) {
    candidates.push(`${resolvedPath.slice(0, -3)}.ts`);
  }

  candidates.push(resolvedPath);

  for (const candidate of candidates) {
    try {
      const stat = await fs.stat(candidate);
      if (stat.isFile()) {
        return candidate;
      }
    } catch {
      // Continue trying other resolution candidates.
    }
  }

  return undefined;
}

function isNodeBuiltin(specifier) {
  return nodeBuiltins.includes(specifier);
}

function loaderForPath(filePath) {
  const extension = path.extname(filePath);
  if (extension === ".ts") {
    return "ts";
  }
  if (extension === ".json") {
    return "json";
  }
  return "js";
}
