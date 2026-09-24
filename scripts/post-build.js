import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const docsDir = path.resolve('docs');

// 1. Ensure .nojekyll in dist and docs
fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
fs.writeFileSync(path.resolve('.nojekyll'), '');

// 2. Synchronize dist -> docs
fs.rmSync(docsDir, { recursive: true, force: true });
fs.cpSync(distDir, docsDir, { recursive: true });
fs.writeFileSync(path.join(docsDir, '.nojekyll'), '');

// 3. Create 404.html fallbacks for SPA
const distIndex = path.join(distDir, 'index.html');
if (fs.existsSync(distIndex)) {
  fs.copyFileSync(distIndex, path.join(distDir, '404.html'));
  fs.copyFileSync(distIndex, path.join(docsDir, '404.html'));
  fs.copyFileSync(distIndex, path.resolve('404.html'));
}

// 4. Backwards compatibility alias for older cached bundles
// The user's browser or cache may request index-B5XTZTTN.js
const distAssets = path.join(distDir, 'assets');
const docsAssets = path.join(docsDir, 'assets');

if (fs.existsSync(distAssets)) {
  const files = fs.readdirSync(distAssets);
  const mainBundle = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
  if (mainBundle) {
    const mainBundleSrc = path.join(distAssets, mainBundle);
    // Copy as index-B5XTZTTN.js in both dist and docs to guarantee no 404
    fs.copyFileSync(mainBundleSrc, path.join(distAssets, 'index-B5XTZTTN.js'));
    fs.copyFileSync(mainBundleSrc, path.join(docsAssets, 'index-B5XTZTTN.js'));
    console.log(`[post-build] Created fallback alias index-B5XTZTTN.js -> ${mainBundle}`);
  }
}

console.log('[post-build] GitHub Pages deployment assets prepared successfully in dist/ and docs/ with .nojekyll and 404 fallbacks.');
