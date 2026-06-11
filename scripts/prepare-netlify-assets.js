const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const publicDir = path.join(rootDir, "public");

function copyPublicAssetDir(assetDirName) {
  const source = path.join(rootDir, assetDirName);
  const destination = path.join(publicDir, assetDirName);

  if (!fs.existsSync(source)) {
    return;
  }

  fs.rmSync(destination, { recursive: true, force: true });
  copyDirectory(source, destination);
  console.log(`Copied ${assetDirName} to public/${assetDirName}`);
}

function copyDirectory(source, destination) {
  fs.mkdirSync(destination, { recursive: true });

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const entrySource = path.join(source, entry.name);
    const entryDestination = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(entrySource, entryDestination);
      continue;
    }

    fs.copyFileSync(entrySource, entryDestination);
  }
}

copyPublicAssetDir("images");
copyPublicAssetDir("font");
