// Regenerates .expo/types/router.d.ts from the files in src/app, without starting the dev server.
// Expo normally does this when the dev server runs; this keeps `bun run typecheck` in step with the routes.
const { readdirSync, writeFileSync, mkdirSync } = require("node:fs");
const path = require("node:path");
const { getTypedRoutesDeclarationFile } = require("@expo/router-server/build/typed-routes/generate.js");

const root = path.resolve(__dirname, "..");
const files = readdirSync(path.join(root, "src/app"))
  .filter((file) => /\.tsx?$/.test(file))
  .map((file) => `./${file}`);
const ctx = Object.assign(() => ({}), { keys: () => files, resolve: (key) => key, id: "src/app" });
const declaration = getTypedRoutesDeclarationFile(ctx);
mkdirSync(path.join(root, ".expo/types"), { recursive: true });
writeFileSync(path.join(root, ".expo/types/router.d.ts"), declaration);
console.log(`route types: ${files.length} files`);
