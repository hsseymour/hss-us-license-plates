const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");

const BASE = "https://francoplaque.fr";
const START = `${BASE}/12-usa`;
const HAWAII = `${BASE}/pa/367-hi`;

const normalizeTitle = (str) => (str || "").trim().replace(/\s+/g, "_");

const getStateCode = (text) => {
    const code = text.split("_")[0];
    return `USA_${code}`;
};

const absolute = (url) => (url.startsWith("http") ? url : BASE + url);

const rows = [];

const fetchHTML = async (url) => {
    try {
        const { data } = await axios.get(url, {
            validateStatus: () => true,
        });
        return cheerio.load(data);
    } catch {
        return null;
    }
};

const run = async () => {
    const $ = await fetchHTML(START);

    const states = [];

    $(".grid-item").each((_, el) => {
        const link = $(el).find("a[href]").attr("href");
        const label = $(el).find("h4 a").text().trim();

        if (!link || !label) return;

        states.push({
            url: absolute(link),
            state: getStateCode(label),
        });
    });

    states.push({
        url: HAWAII,
        state: "USA_HI",
        isDirect: true,
    });

    for (const state of states) {
        const $p = await fetchHTML(state.url);
        if (!$p) continue;

        let categories = [];

        if (state.isDirect) {
            categories = [state.url];
        } else {
            $p(".grid-item").each((_, el) => {
                const link = $p(el).find("a[href]").attr("href");

                if (!link || !/^\/usa\/[a-z]{2}\/\d+/.test(link)) return;

                categories.push(absolute(link));
            });
        }

        for (const categoryUrl of categories) {
            const $c = await fetchHTML(categoryUrl);
            if (!$c) continue;

            if ($c("title").text().includes("Error")) continue;

            const images = $c(".grid-item img");
            if (!images.length) continue;

            images.each((_, img) => {
                const src = $c(img).attr("src");
                const alt = $c(img).attr("alt") || "";

                if (!src) return;

                const sourceImg = absolute(src);
                const plateImg = src.split("/").pop();

                rows.push([
                    state.state,
                    normalizeTitle(alt || plateImg),
                    plateImg,
                    sourceImg,
                    categoryUrl,
                ]);
            });
        }
    }

    const csv = [
        "state,plate_title,plate_img,source_img,source",
        ...rows.map((r) => r.join(",")),
    ].join("\n");

    fs.writeFileSync("usa_plates.csv", csv);
};

run();
