const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CSS_FILE = path.join(ROOT, 'client', 'index.css');
const CLIENT_DIR = path.join(ROOT, 'client');

function readCSS(file) {
  return fs.readFileSync(file, 'utf8');
}

function extractClassSelectors(cssText) {
  // crude regex to extract .class-name from selectors
  const selectorBlock = cssText.split('{')[0];
  const regex = /\.([a-zA-Z0-9_\-]+)\b/g;
  const classes = new Set();
  let match;
  // iterate over all selectors in the file
  const parts = cssText.split('}');
  for (const part of parts) {
    const head = part.split('{')[0] || '';
    while ((match = regex.exec(head))) {
      classes.add(match[1]);
    }
  }
  return Array.from(classes).sort();
}

function walkDir(dir, exts = ['.tsx', '.ts', '.js', '.jsx', '.html']) {
  const files = [];
  const items = fs.readdirSync(dir);
  for (const it of items) {
    const full = path.join(dir, it);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      files.push(...walkDir(full, exts));
    } else if (exts.includes(path.extname(it))) {
      files.push(full);
    }
  }
  return files;
}

function searchUsage(className, files) {
  const regex = new RegExp('class(Name)?\\s*=\\s*{?\\s*[`"\']?[^`"\']*\\b' + className + '\\b', 'i');
  // also search for occurrences in template literals or JSX
  const plain = new RegExp('\\.' + className + '\\b', 'i');
  for (const f of files) {
    const txt = fs.readFileSync(f, 'utf8');
    if (regex.test(txt) || plain.test(txt)) return true;
  }
  return false;
}

function main() {
  if (!fs.existsSync(CSS_FILE)) {
    console.error('CSS file not found:', CSS_FILE);
    process.exit(1);
  }
  const cssText = readCSS(CSS_FILE);
  const classes = extractClassSelectors(cssText);
  console.log(`Found ${classes.length} class selectors in index.css`);

  const files = walkDir(CLIENT_DIR);
  console.log(`Scanning ${files.length} client source files for usages...`);

  const unused = [];
  for (const cls of classes) {
    const used = searchUsage(cls, files);
    if (!used) unused.push(cls);
  }

  const report = { timestamp: new Date().toISOString(), totalSelectors: classes.length, unusedCount: unused.length, unused };
  fs.writeFileSync(path.join(ROOT, 'tools', 'unused-css-report.json'), JSON.stringify(report, null, 2));
  console.log(`Scan complete. Unused selectors: ${unused.length}. Report saved to tools/unused-css-report.json`);
  if (unused.length <= 200) console.log(unused.join(', '));
  else console.log('Too many unused selectors to display');
}

main();
