import fs from "fs";
import path from "path";
import zlib from "zlib";
import * as esbuild from "esbuild";
import JSZip from "jszip";

// 1. CRC32 and PNG Generation Utilities
function makeCRCTable() {
  let c;
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }
  return crcTable;
}

const crcTable = makeCRCTable();

function crc32(buf) {
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function createPNG(width, height, drawPixel) {
  const rowBytes = width * 4 + 1;
  const rawData = Buffer.alloc(rowBytes * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawPixel(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdrTypeAndData = Buffer.concat([Buffer.from("IHDR"), ihdrData]);
  const ihdrChunk = Buffer.alloc(4 + 4 + 13 + 4);
  ihdrChunk.writeUInt32BE(13, 0);
  ihdrTypeAndData.copy(ihdrChunk, 4);
  ihdrChunk.writeUInt32BE(crc32(ihdrTypeAndData), 21);

  const idatTypeAndData = Buffer.concat([Buffer.from("IDAT"), compressed]);
  const idatChunk = Buffer.alloc(4 + 4 + compressed.length + 4);
  idatChunk.writeUInt32BE(compressed.length, 0);
  idatTypeAndData.copy(idatChunk, 4);
  idatChunk.writeUInt32BE(crc32(idatTypeAndData), 8 + compressed.length);

  const iendTypeAndData = Buffer.from("IEND");
  const iendChunk = Buffer.alloc(4 + 4 + 4);
  iendChunk.writeUInt32BE(0, 0);
  iendTypeAndData.copy(iendChunk, 4);
  iendChunk.writeUInt32BE(crc32(iendTypeAndData), 8);

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function drawYouTubeIcon(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;
  const pad = 0.08;
  const radius = 0.22;
  const minX = pad, maxX = 1 - pad, minY = pad, maxY = 1 - pad;

  let inBox = false;
  if (nx >= minX && nx <= maxX && ny >= minY && ny <= maxY) {
    const dx = Math.max(minX + radius - nx, 0, nx - (maxX - radius));
    const dy = Math.max(minY + radius - ny, 0, ny - (maxY - radius));
    if (dx * dx + dy * dy <= radius * radius) {
      inBox = true;
    }
  }

  if (!inBox) {
    return [0, 0, 0, 0];
  }

  const p1 = { x: 0.38, y: 0.32 };
  const p2 = { x: 0.68, y: 0.5 };
  const p3 = { x: 0.38, y: 0.68 };

  function sign(p1, p2, p3) {
    return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
  }

  function inTriangle(pt, v1, v2, v3) {
    const d1 = sign(pt, v1, v2);
    const d2 = sign(pt, v2, v3);
    const d3 = sign(pt, v3, v1);
    const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
    const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(hasNeg && hasPos);
  }

  if (inTriangle({ x: nx, y: ny }, p1, p2, p3)) {
    return [255, 255, 255, 255]; // White play triangle
  }

  return [239, 68, 68, 255]; // Red #EF4444
}

async function buildExtension() {
  console.log("⚡ [StudyLens Build] Building Chrome Extension Package...");

  // 1. Setup Directories
  const extensionDir = path.resolve("./extension");
  const iconsDir = path.join(extensionDir, "icons");
  const bgDir = path.join(extensionDir, "background");
  const contentDir = path.join(extensionDir, "content");
  const spDir = path.join(extensionDir, "sidepanel");
  const publicIconsDir = path.resolve("./public/icons");
  const publicDir = path.resolve("./public");

  fs.mkdirSync(iconsDir, { recursive: true });
  fs.mkdirSync(bgDir, { recursive: true });
  fs.mkdirSync(contentDir, { recursive: true });
  fs.mkdirSync(spDir, { recursive: true });
  fs.mkdirSync(publicIconsDir, { recursive: true });
  fs.mkdirSync(publicDir, { recursive: true });

  // 2. Generate and write icons (16, 48, 128)
  [16, 48, 128].forEach((size) => {
    const pngBuf = createPNG(size, size, drawYouTubeIcon);
    fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), pngBuf);
    fs.writeFileSync(path.join(publicIconsDir, `icon${size}.png`), pngBuf);
  });
  console.log("✓ Generated extension icons");

  // 3. Bundle Content Script with esbuild
  await esbuild.build({
    entryPoints: ["./src/extension/content/content-script.ts"],
    bundle: true,
    outfile: "./extension/content/content-script.js",
    format: "iife",
    platform: "browser",
    target: "es2020",
    minify: false,
    sourcemap: false,
  });
  console.log("✓ Bundled Content Script (content/content-script.js)");

  // 4. Bundle Background Service Worker with esbuild
  await esbuild.build({
    entryPoints: ["./src/extension/background/service-worker.ts"],
    bundle: true,
    outfile: "./extension/background/service-worker.js",
    format: "esm",
    platform: "browser",
    target: "es2020",
    minify: false,
    sourcemap: false,
  });
  console.log("✓ Bundled Background Service Worker (background/service-worker.js)");

  // 5. Copy built React SidePanel from dist/
  const distDir = path.resolve("./dist");
  const distSidepanelHtml = path.join(distDir, "sidepanel.html");
  const distAssetsDir = path.join(distDir, "assets");

  if (fs.existsSync(distSidepanelHtml)) {
    let htmlContent = fs.readFileSync(distSidepanelHtml, "utf-8");
    // Ensure relative paths from sidepanel/ to assets/ work
    // In dist/sidepanel.html, links are typically "./assets/..." or "assets/..."
    // In extension/sidepanel/index.html, we also copy assets/ into extension/assets and extension/sidepanel/assets
    fs.writeFileSync(path.join(spDir, "index.html"), htmlContent);
    fs.writeFileSync(path.join(extensionDir, "index.html"), htmlContent);
    console.log("✓ Synchronized React SidePanel HTML to extension/sidepanel/index.html");
  } else {
    console.warn("⚠️ Warning: dist/sidepanel.html not found, using fallback");
  }

  if (fs.existsSync(distAssetsDir)) {
    const extAssetsDir = path.join(extensionDir, "assets");
    const spAssetsDir = path.join(spDir, "assets");
    fs.mkdirSync(extAssetsDir, { recursive: true });
    fs.mkdirSync(spAssetsDir, { recursive: true });

    const files = fs.readdirSync(distAssetsDir);
    for (const f of files) {
      fs.copyFileSync(path.join(distAssetsDir, f), path.join(extAssetsDir, f));
      fs.copyFileSync(path.join(distAssetsDir, f), path.join(spAssetsDir, f));
    }
    console.log(`✓ Copied ${files.length} React bundle assets to extension/assets`);
  }

  // 6. manifest.json
  const manifest = {
    manifest_version: 3,
    name: "StudyLens AI for YouTube",
    version: "2.2.0",
    description: "Trợ lý học tập thông minh trên YouTube với mốc kiểm tra kiến thức theo mốc thời gian, đồng bộ phụ đề và hàng đợi ôn tập tự động.",
    permissions: [
      "storage",
      "tabs",
      "sidePanel",
      "scripting"
    ],
    host_permissions: [
      "https://www.youtube.com/*",
      "https://youtube.com/*",
      "*://*.youtube.com/*",
      "*://youtube.com/*"
    ],
    background: {
      service_worker: "background/service-worker.js",
      type: "module"
    },
    action: {
      default_title: "Mở StudyLens AI for YouTube",
      default_icon: {
        "16": "icons/icon16.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
      }
    },
    side_panel: {
      default_path: "sidepanel/index.html"
    },
    content_scripts: [
      {
        matches: [
          "https://www.youtube.com/*",
          "https://youtube.com/*",
          "*://*.youtube.com/*",
          "*://youtube.com/*"
        ],
        js: [
          "content/content-script.js"
        ],
        run_at: "document_idle",
        all_frames: false
      }
    ],
    icons: {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  };
  fs.writeFileSync(path.join(extensionDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log("✓ Generated extension/manifest.json (Manifest V3)");

  // 7. Generate README.md
  const readme = `# StudyLens AI for YouTube - Chrome & Edge Extension (v2.2.0)

## Hướng dẫn cài đặt tiện ích vào Chrome / Edge:
1. Mở Google Chrome hoặc Microsoft Edge.
2. Truy cập: \`chrome://extensions\` (hoặc \`edge://extensions\`).
3. Bật **Developer mode** (Chế độ dành cho nhà phát triển ở góc trên bên phải).
4. Nhấp nút **Load unpacked** (Tải tiện ích đã giải nén).
5. Chọn thư mục \`extension\` (nơi chứa file \`manifest.json\`).
6. Mở video bài giảng bất kỳ trên YouTube:
   - Ví dụ: \`https://www.youtube.com/watch?v=4b4MUYve_U8\`
7. Mở Side Panel StudyLens AI trên thanh công cụ:
   - Giao diện React đầy đủ của StudyLens AI sẽ xuất hiện với 5 tab: **Học tập**, **Ôn tập**, **Lịch sử**, **Thống kê**, **Cài đặt**.
   - Tự động nhận diện video YouTube, đồng bộ tiến độ thời gian thực, đánh giá độ sẵn sàng của kiến thức và tạo câu hỏi kiểm tra bằng tiếng Việt!
`;
  fs.writeFileSync(path.join(extensionDir, "README.md"), readme);

  // 8. Package all files into ZIP archive using JSZip
  const zip = new JSZip();

  function addFolderToZip(folderPath, zipFolder) {
    const items = fs.readdirSync(folderPath);
    for (const item of items) {
      const fullPath = path.join(folderPath, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        addFolderToZip(fullPath, zipFolder.folder(item));
      } else {
        const fileContent = fs.readFileSync(fullPath);
        zipFolder.file(item, fileContent);
      }
    }
  }

  addFolderToZip(extensionDir, zip);

  const zipContent = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });

  const zipPath = path.join(publicDir, "studylens-ai-youtube-extension.zip");
  fs.writeFileSync(zipPath, zipContent);
  fs.writeFileSync(path.resolve("./extension.zip"), zipContent);
  fs.writeFileSync(path.join(publicDir, "extension.zip"), zipContent);

  console.log(`🎉 [StudyLens Build] Successfully generated: ${zipPath} (${(zipContent.length / 1024).toFixed(1)} KB)`);
}

buildExtension().catch((err) => {
  console.error("❌ Build error:", err);
  process.exit(1);
});
