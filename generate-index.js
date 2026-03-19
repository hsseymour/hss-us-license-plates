import fs from "fs";
import path from "path";

const root = "./plates";

for (const state of fs.readdirSync(root)) {
    const dir = path.join(root, state);
    if (!fs.statSync(dir).isDirectory()) continue;

    const files = fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".webp"))
        .map((f) => encodeURIComponent(f));

    const outPath = path.join(dir, "index.json");
    fs.writeFileSync(outPath, JSON.stringify(files, null, 2));
}
