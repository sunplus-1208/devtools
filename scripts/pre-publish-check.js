#!/usr/bin/env node
/**
 * Pre-publish content quality gate
 * Run before every article publish: node scripts/pre-publish-check.js blog/article.html
 */

const fs = require('fs');
const path = require('path');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/pre-publish-check.js <article.html>');
  process.exit(1);
}

const content = fs.readFileSync(file, 'utf8');
let score = 0;
let maxScore = 0;
const checks = [];

function check(name, weight, test, failMsg) {
  maxScore += weight;
  if (test) {
    score += weight;
    checks.push(`✅ ${name}`);
  } else {
    checks.push(`❌ ${name} — ${failMsg}`);
  }
}

// === 硬性红线 ===
check('No visible Chinese in EN', 20, 
  !/[一-龥]/.test(content.replace(/zh:\s*\{[\s\S]*?\}/g, '').replace(/中文/g, '')),
  'Remove Chinese text from EN-visible elements');

check('Has last-updated timestamp', 15,
  /last[- ]?updated|updated:\s*\d|最后更新/i.test(content),
  'Add "Last updated: YYYY-MM-DD" to article');

check('Has external links', 10,
  /href="https?:\/\//.test(content),
  'Add at least one external reference link');

check('Has structured data', 10,
  /application\/ld\+json/.test(content),
  'Add JSON-LD structured data for SEO');

// === 质量标准 ===
check('Has comparison table or code block', 10,
  /<table/.test(content) || /<pre/.test(content),
  'Add a comparison table or code example');

check('Has specific numbers/prices', 10,
  /\$\d|\d+\.\d+|\d+%|\d+\s*(GB|MB|tokens?|RPM)/i.test(content),
  'Include specific numbers, prices, or metrics');

check('Has clear conclusion', 10,
  /conclusion|recommend|verdict|bottom.line|summary/i.test(content) || /适合|推荐|结论|总结/.test(content),
  'Add a conclusion or recommendation section');

check('Title matches content', 10,
  /<title>[^<]+<\/title>/i.test(content) && /<h1[^>]*>[^<]+<\/h1>/i.test(content),
  'Ensure <title> and <h1> are present and accurate');

check('Reasonable length', 5,
  content.length > 3000,
  'Article seems too short (< 3000 chars), expand content');

// === 输出结果 ===
console.log('\n=== Content Quality Check ===\n');
checks.forEach(c => console.log(c));

const pct = Math.round((score / maxScore) * 100);
console.log(`\nScore: ${score}/${maxScore} (${pct}%)`);

if (pct >= 80) {
  console.log('✅ PASSED — Ready to publish');
  process.exit(0);
} else if (pct >= 60) {
  console.log('⚠️  MARGINAL — Fix warnings before publish');
  process.exit(1);
} else {
  console.log('❌ FAILED — Major issues, do not publish');
  process.exit(1);
}
