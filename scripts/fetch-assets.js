// downloads sample GLB/HDR assets into public/assets on npm install
const https = require('https');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'public', 'assets');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const files = [
  {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb',
    name: 'fox.glb'
  },
  {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb',
    name: 'cesium.glb'
  },
  {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb',
    name: 'avocado.glb'
  },
  {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF-Binary/BoomBox.glb',
    name: 'boombox.glb'
  },
  {
    url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/equirectangular/royal_esplanade_1k.hdr',
    name: 'env_royal_esplanade_1k.hdr'
  }
];

function download(file) {
  return new Promise((resolve, reject) => {
    const outPath = path.join(outDir, file.name);
    // skip if exists
    if (fs.existsSync(outPath)) {
      console.log('Asset exists, skipping:', file.name);
      return resolve();
    }
    console.log('Downloading', file.url);
    const req = https.get(file.url, (res) => {
      if (res.statusCode !== 200) return reject(new Error('Failed to download ' + file.url + ' code=' + res.statusCode));
      const fileStream = fs.createWriteStream(outPath);
      res.pipe(fileStream);
      fileStream.on('finish', () => { fileStream.close(); console.log('Saved', file.name); resolve(); });
    });
    req.on('error', (err) => reject(err));
  });
}

(async () => {
  for (const f of files) {
    try { await download(f); } catch (e) { console.warn('Failed to fetch asset', f.name, e.message); }
  }
  console.log('Asset fetch complete.');
})();
