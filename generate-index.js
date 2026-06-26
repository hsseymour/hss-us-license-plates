const fs = require("fs");
const path = require("path");

const baseDir = path.join(__dirname, "plates");
const outputFile = path.join(__dirname, "plates/index.json");

const result = {};

const countries = fs
    .readdirSync(baseDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

for (const country of countries) {
    const countryPath = path.join(baseDir, country);
    result[country] = {};

    const states = fs
        .readdirSync(countryPath, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);

    for (const state of states) {
        const statePath = path.join(countryPath, state);

        const files = fs
            .readdirSync(statePath)
            .filter((f) => fs.statSync(path.join(statePath, f)).isFile());

        result[country][state] = files;
    }
}

fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
console.log("index.json generated");
