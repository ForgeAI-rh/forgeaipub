// Crawls a running instance and reports any dash characters in visible text.
// Usage: npm run check:copy  (expects the app on http://localhost:3000)
const base = process.argv[2] ?? "http://localhost:3000";
const seen = new Set();
const queue = ["/"];
const problems = [];

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<");
}

function attrText(html) {
  const out = [];
  for (const m of html.matchAll(/\s(?:title|placeholder|aria-label|alt)="([^"]*)"/g)) out.push(m[1]);
  for (const m of html.matchAll(/<title>([^<]*)<\/title>/g)) out.push(m[1]);
  return out;
}

while (queue.length && seen.size < 80) {
  const path = queue.shift();
  if (seen.has(path)) continue;
  seen.add(path);
  const res = await fetch(base + path, { redirect: "manual" });
  if (!res.ok) continue;
  const html = await res.text();
  const chunks = [...visibleText(html).split("\n"), ...attrText(html)];
  for (const raw of chunks) {
    const line = raw.trim();
    if (!line) continue;
    if (/[\u002d\u2010-\u2015\u2212]/.test(line)) problems.push(`${path}  "${line.slice(0, 90)}"`);
  }
  for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
    const next = m[1];
    if (!next.startsWith("/api") && !next.startsWith("/_next") && !seen.has(next)) queue.push(next);
  }
}

if (problems.length) {
  console.log([...new Set(problems)].join("\n"));
  console.log(`\n${problems.length} dash occurrences across ${seen.size} pages.`);
  process.exit(1);
}
console.log(`Copy check passed on ${seen.size} pages. No dashes in visible text.`);
