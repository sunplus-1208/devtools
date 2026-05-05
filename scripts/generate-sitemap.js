#!/usr/bin/env node
/**
 * Auto-generate sitemap.xml from file system
 * Run: node scripts/generate-sitemap.js
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://aitechtools.top';
const ROOT = path.join(__dirname, '..');

function getHtmlFiles(dir, basePath = '') {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    
    const fullPath = path.join(dir, entry.name);
    const relPath = basePath ? `${basePath}/${entry.name}` : entry.name;
    
    if (entry.isDirectory()) {
      files.push(...getHtmlFiles(fullPath, relPath));
    } else if (entry.name.endsWith('.html')) {
      files.push(relPath);
    }
  }
  
  return files;
}

function getPriority(file) {
  if (file === 'index.html') return '1.0';
  if (file === 'blog/index.html') return '0.9';
  if (file.startsWith('blog/')) return '0.8';
  if (file === 'ai-toolkit/index.html') return '0.8';
  if (file.startsWith('ai-toolkit/')) return '0.6';
  if (file.startsWith('tools/')) return '0.5';
  return '0.5';
}

function getChangefreq(file) {
  if (file === 'index.html') return 'weekly';
  if (file.startsWith('blog/')) return 'monthly';
  if (file.startsWith('ai-toolkit/')) return 'weekly';
  return 'monthly';
}

const htmlFiles = getHtmlFiles(ROOT)
  .filter(f => !f.startsWith('scripts/'))
  .sort((a, b) => {
    // index.html first, then by priority
    if (a === 'index.html') return -1;
    if (b === 'index.html') return 1;
    return getPriority(b).localeCompare(getPriority(a));
  });

const today = new Date().toISOString().split('T')[0];

let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

for (const file of htmlFiles) {
  const urlPath = file === 'index.html' ? '' : file.replace(/index\.html$/, '');
  const loc = `${BASE_URL}/${urlPath}`;
  const priority = getPriority(file);
  const changefreq = getChangefreq(file);
  
  xml += '  <url>\n';
  xml += `    <loc>${loc}</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `    <changefreq>${changefreq}</changefreq>\n`;
  xml += `    <priority>${priority}</priority>\n`;
  xml += '  </url>\n';
}

xml += '</urlset>\n';

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
console.log(`Generated sitemap.xml with ${htmlFiles.length} URLs`);
