const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const base = "http://www.15q.net/";

const CAN_MAP = {
    Alberta: "AB",
    "British Columbia": "BC",
    Manitoba: "MB",
    "New Brunswick": "NB",
    "Newfoundland & Labrador": "NL",
    "Northwest Territories": "NT",
    "Nova Scotia": "NS",
    Nunavut: "NU",
    Ontario: "ON",
    "Prince Edward Island": "PE",
    Quebec: "QC",
    Saskatchewan: "SK",
    Yukon: "YT",
};

const USA_MAP = {
    Alabama: "AL",
    Alaska: "AK",
    Arizona: "AZ",
    Arkansas: "AR",
    California: "CA",
    Colorado: "CO",
    Connecticut: "CT",
    Delaware: "DE",
    "District of Columbia": "DC",
    Florida: "FL",
    Georgia: "GA",
    Hawaii: "HI",
    Idaho: "ID",
    Illinois: "IL",
    Indiana: "IN",
    Iowa: "IA",
    Kansas: "KS",
    Kentucky: "KY",
    Louisiana: "LA",
    Maine: "ME",
    Maryland: "MD",
    Massachusetts: "MA",
    Michigan: "MI",
    Minnesota: "MN",
    Mississippi: "MS",
    Missouri: "MO",
    Montana: "MT",
    Nebraska: "NE",
    Nevada: "NV",
    "New Hampshire": "NH",
    "New Jersey": "NJ",
    "New Mexico": "NM",
    "New York": "NY",
    "North Carolina": "NC",
    "North Dakota": "ND",
    Ohio: "OH",
    Oklahoma: "OK",
    Oregon: "OR",
    Pennsylvania: "PA",
    "Rhode Island": "RI",
    "South Carolina": "SC",
    "South Dakota": "SD",
    Tennessee: "TN",
    Texas: "TX",
    Utah: "UT",
    Vermont: "VT",
    Virginia: "VA",
    Washington: "WA",
    "West Virginia": "WV",
    Wisconsin: "WI",
    Wyoming: "WY",
};

const MEX_MAP = {
    "Federal Issues, 1968-1998": "MX",
    Aguascalientes: "AG",
    "Baja California": "BC",
    "Baja California Sur": "BS",
    Campeche: "CM",
    Chiapas: "CS",
    Chihuahua: "CH",
    Coahuila: "CO",
    Colima: "CL",
    "Distrito Federal": "DF",
    Durango: "DG",
    Guerrero: "GR",
    Guanajuato: "GT",
    Hidalgo: "HG",
    Jalisco: "JA",
    Mexico: "MX",
    Michoacan: "MI",
    Morelos: "MO",
    Nayarit: "NA",
    "Nuevo Leon": "NL",
    Oaxaca: "OA",
    Puebla: "PU",
    Queretaro: "QE",
    "Quintana Roo": "QR",
    "San Luis Potosi": "SL",
    Sinaloa: "SI",
    Sonora: "SO",
    Tabasco: "TB",
    Tamaulipas: "TM",
    Tlaxcala: "TL",
    Veracruz: "VE",
    Yucatan: "YU",
    Zacatecas: "ZA",
};

const rows = [];

const normalize = (text) => text.trim().replace(/\s+/g, "_");

const toCode = (name) =>
    name
        .replace(/[^a-zA-Z ]/g, "")
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase();

async function scrapeStatePage(url, country, code) {
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);

    $("table img").each((_, img) => {
        const alt = $(img).attr("alt");
        const src = $(img).attr("src");

        if (!alt || !src) return;

        const height = Number($(img).attr("height"));
        if (height && height < 100) return;

        const fileName = path.basename(src);

        rows.push({
            country,
            state: `${country}_${code}`,
            plate_title: normalize(alt),
            plate_img: fileName,
            source_img: base + src,
            source: url,
        });
    });
}

/* ---------------- CANADA ---------------- */

async function scrapeCanada() {
    const res = await axios.get(base + "canindexold.html");
    const $ = cheerio.load(res.data);

    const links = [];

    $("table a").each((_, el) => {
        const name = $(el).text().trim();
        const href = $(el).attr("href");
        if (!href) return;

        links.push({
            name,
            url: base + href,
        });
    });

    for (const s of links) {
        const code = CAN_MAP[s.name];
        if (!code) return;
        await scrapeStatePage(s.url, "CAN", code);
    }
}

/* ---------------- USA ---------------- */

async function scrapeUSA() {
    const res = await axios.get(base + "usindex.html");
    const $ = cheerio.load(res.data);

    const links = [];

    $("select[name='url'] option").each((_, el) => {
        const url = $(el).attr("value");
        const name = $(el).text().trim();

        if (!url || name === "Select a State") return;

        links.push({ name, url });
    });

    for (const s of links) {
        const code = USA_MAP[s.name];
        if (!code) return;
        await scrapeStatePage(s.url, "USA", code);
    }
}

/* ---------------- MEXICO ---------------- */

async function scrapeMexico() {
    const res = await axios.get(base + "mexindex.html");
    const $ = cheerio.load(res.data);

    const links = [];

    $("select[name='url'] option").each((_, el) => {
        const url = $(el).attr("value");
        const name = $(el).text().trim();

        if (!url || name === "Select a Page") return;

        links.push({ name, url });
    });

    for (const s of links) {
        const code = MEX_MAP[s.name];
        if (!code) return;
        await scrapeStatePage(s.url, "MEX", code);
    }
}

/* ---------------- RUN ---------------- */

async function run() {
    await scrapeCanada();
    await scrapeUSA();
    await scrapeMexico();

    const csv = [
        "country,state,plate_title,plate_img,source_img,source",
        ...rows.map(
            (r) =>
                `${r.country},${r.state},${r.plate_title},${r.plate_img},${r.source_img},${r.source}`
        ),
    ].join("\n");

    fs.writeFileSync("data_files/USA.csv", csv);

    console.log("Done. plates_all.csv created.");
}

run();
