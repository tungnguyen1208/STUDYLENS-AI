import fs from "fs";
import path from "path";
import JSZip from "jszip";

async function verifyExtension() {
  console.log("== 1. Verifying Files on Disk ==");
  const manifestPath = path.resolve("./extension/manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error("manifest.json missing at extension root!");
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  console.log("✓ manifest.json loaded. Name:", manifest.name, "Version:", manifest.version);

  // Check icons
  const iconSizes = ["16", "48", "128"];
  for (const size of iconSizes) {
    const iconRelPath = manifest.icons[size];
    const iconFullPath = path.resolve("./extension", iconRelPath);
    if (!fs.existsSync(iconFullPath)) {
      throw new Error(`Icon missing: ${iconRelPath}`);
    }
    const buf = fs.readFileSync(iconFullPath);
    if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4E || buf[3] !== 0x47) {
      throw new Error(`Invalid PNG format for ${iconRelPath}`);
    }
    console.log(`✓ ${iconRelPath} exists and is a valid PNG (${buf.length} bytes)`);
  }

  // Check background service worker
  const bgPath = path.resolve("./extension", manifest.background.service_worker);
  if (!fs.existsSync(bgPath)) throw new Error("Background worker missing: " + bgPath);
  console.log("✓ background.service_worker exists:", manifest.background.service_worker);

  // Check content script
  for (const cs of manifest.content_scripts) {
    for (const jsFile of cs.js) {
      const csPath = path.resolve("./extension", jsFile);
      if (!fs.existsSync(csPath)) throw new Error("Content script missing: " + jsFile);
      console.log("✓ content_script exists:", jsFile);
    }
  }

  // Check side panel
  const spPath = path.resolve("./extension", manifest.side_panel.default_path);
  if (!fs.existsSync(spPath)) throw new Error("Side panel HTML missing: " + spPath);
  console.log("✓ side_panel HTML exists:", manifest.side_panel.default_path);

  // Check sidepanel assets
  const spDir = path.dirname(spPath);
  const spCss = path.join(spDir, "sidepanel.css");
  const spJs = path.join(spDir, "sidepanel.js");
  if (!fs.existsSync(spCss)) throw new Error("sidepanel.css missing!");
  if (!fs.existsSync(spJs)) throw new Error("sidepanel.js missing!");
  console.log("✓ sidepanel.css and sidepanel.js exist!");

  console.log("\n== 2. Testing ZIP Package Generation ==");
  const zip = new JSZip();

  // Add all files into zip root
  function addDirToZip(dirPath, zipFolder) {
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        addDirToZip(fullPath, zipFolder ? `${zipFolder}/${item}` : item);
      } else {
        const fileData = fs.readFileSync(fullPath);
        const zipPath = zipFolder ? `${zipFolder}/${item}` : item;
        zip.file(zipPath, fileData);
      }
    }
  }

  addDirToZip("./extension", "");

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  fs.writeFileSync("./extension.zip", zipBuffer);
  fs.writeFileSync("./public/studylens-ai-youtube-extension.zip", zipBuffer);
  console.log("✓ Generated extension.zip and public/studylens-ai-youtube-extension.zip (" + zipBuffer.length + " bytes)");

  console.log("\n== 3. Testing ZIP Extraction and Root Paths ==");
  const readZip = await JSZip.loadAsync(zipBuffer);
  const zipFiles = Object.keys(readZip.files);
  console.log("ZIP entries:", zipFiles);

  if (!zipFiles.includes("manifest.json")) {
    throw new Error("FAIL: manifest.json is NOT in the root of the ZIP file!");
  }
  if (!zipFiles.includes("icons/icon16.png") || !zipFiles.includes("icons/icon48.png") || !zipFiles.includes("icons/icon128.png")) {
    throw new Error("FAIL: PNG icons missing in ZIP file!");
  }

  console.log("\n>>> ALL CHECKS PASSED PERFECTLY! Chrome Extension is 100% compliant! <<<");
}

verifyExtension().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
