const fs = require("fs-extra");
const path = require("path");
const fetch = require("node-fetch");
const csv = require("csv-parser");
const sharp = require("sharp");

const FILES = [
    { path: "data_files/mex_plates.csv", country: "mex" },
    { path: "data_files/usa_plates.csv", country: "usa" },
    { path: "data_files/can_plates.csv", country: "can" },
];

const OUTPUT_ROOT = "plates";

const clean = (str) =>
    str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

async function downloadAndConvert(url, outputPath) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const buffer = await res.buffer();

        await sharp(buffer).webp({ quality: 85 }).toFile(outputPath);
    } catch (err) {
        console.error("Failed:", url, err.message);
    }
}

async function processFile(fileConfig) {
    return new Promise((resolve) => {
        const rows = [];

        fs.createReadStream(fileConfig.path)
            .pipe(csv())
            .on("data", (row) => rows.push(row))
            .on("end", async () => {
                for (const row of rows) {
                    const stateRaw = row.state || "unknown";
                    const plateRaw = row.plate_title || row.plate_img || "plate";

                    const state = clean(stateRaw.replace(/^.*?_/, "")).toUpperCase();
                    const plateName = clean(plateRaw);

                    const dir = path.join(OUTPUT_ROOT, fileConfig.country.toUpperCase(), state);
                    await fs.ensureDir(dir);

                    const outputPath = path.join(dir, `${plateName}.webp`);

                    await downloadAndConvert(row.source_img, outputPath);

                    console.log("Saved:", outputPath);
                }

                resolve();
            });
    });
}

async function run() {
    for (const file of FILES) {
        await processFile(file);
    }
    console.log("Done");
}

run();
