/**
 * Headless PNG export at native WhatsApp sizes.
 * Usage: npm install && npm run export
 * Optional: place baby photo at assets/baby.jpg (or .png) before exporting.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "exports");
const assetsDir = path.join(__dirname, "assets");

const POSTERS = [
  {
    id: "poster-portrait-blush",
    file: "nissita-first-birthday-portrait-blush-gold.png",
    w: 1080,
    h: 1920,
  },
  {
    id: "poster-square-blush",
    file: "nissita-first-birthday-square-blush-gold.png",
    w: 1080,
    h: 1080,
  },
  {
    id: "poster-portrait-rose",
    file: "nissita-first-birthday-portrait-rose-gold.png",
    w: 1080,
    h: 1920,
  },
  {
    id: "poster-square-rose",
    file: "nissita-first-birthday-square-rose-gold.png",
    w: 1080,
    h: 1080,
  },
];

function findBabyPhoto() {
  const candidates = [
    path.join(assetsDir, "baby.jpg"),
    path.join(assetsDir, "baby.jpeg"),
    path.join(assetsDir, "baby.png"),
    path.join(assetsDir, "baby.webp"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }

  // Prefer any image already in assets/
  if (fs.existsSync(assetsDir)) {
    const anyAsset = fs
      .readdirSync(assetsDir)
      .find((f) => /\.(jpe?g|png|webp)$/i.test(f));
    if (anyAsset) return path.join(assetsDir, anyAsset);
  }

  // Fall back to data/ folder (user-provided samples)
  const dataDir = path.join(__dirname, "data");
  if (fs.existsSync(dataDir)) {
    const anyData = fs
      .readdirSync(dataDir)
      .find((f) => /\.(jpe?g|png|webp)$/i.test(f));
    if (anyData) return path.join(dataDir, anyData);
  }

  return null;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(assetsDir, { recursive: true });

  const indexPath = path.join(__dirname, "index.html");
  const url = pathToFileURL(indexPath).href;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 2400, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "networkidle0" });
  await page.evaluateHandle("document.fonts.ready");

  const photoPath = findBabyPhoto();
  if (photoPath) {
    const buf = fs.readFileSync(photoPath);
    const ext = path.extname(photoPath).toLowerCase();
    const mime =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : "image/jpeg";
    const dataUrl = `data:${mime};base64,${buf.toString("base64")}`;
    await page.evaluate((dataUrl) => {
      document.querySelectorAll(".photo-inner").forEach((inner) => {
        let img = inner.querySelector("img.baby-photo");
        const placeholder = inner.querySelector(".photo-slot");
        if (!img) {
          img = document.createElement("img");
          img.className = "baby-photo";
          img.alt = "Nissita Mangam";
          inner.appendChild(img);
        }
        img.src = dataUrl;
        if (placeholder) placeholder.style.display = "none";
      });
    }, dataUrl);
    console.log(`Using photo: ${path.basename(photoPath)}`);
  } else {
    console.log(
      "No photo in assets/ yet — exporting with placeholder. Add assets/baby.jpg and re-run."
    );
  }

  // Un-scale all preview wrappers for crisp capture
  await page.evaluate(() => {
    document.querySelectorAll(".preview-scale").forEach((el) => {
      el.style.transform = "none";
      const poster = el.querySelector(".poster");
      if (poster?.classList.contains("portrait")) {
        el.style.width = "1080px";
        el.style.height = "1920px";
      } else {
        el.style.width = "1080px";
        el.style.height = "1080px";
      }
    });
  });

  await new Promise((r) => setTimeout(r, 300));

  for (const spec of POSTERS) {
    const el = await page.$(`#${spec.id}`);
    if (!el) {
      console.warn(`Missing #${spec.id}`);
      continue;
    }
    const out = path.join(outDir, spec.file);
    await el.screenshot({
      path: out,
      type: "png",
      omitBackground: false,
    });
    console.log(`Wrote ${out}`);
  }

  await browser.close();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
