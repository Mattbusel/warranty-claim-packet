// Records the Round 1 walkthrough video for Warranty Claim Packet: drives headless Chrome through the
// real repo pages and a real run of the official uliya-skill-kit checker, narrates each scene with
// Piper (local TTS, no music), and assembles an MP4 with ffmpeg.
//   node scripts/demo/record.mjs
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const REPO = "https://github.com/Mattbusel/warranty-claim-packet";
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const VOICE = process.env.PIPER_MODEL || "C:/Users/Matthew/hackathons/tts/en_US-ryan-high.onnx";
const OUT = path.join(ROOT, "demo-out", new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19));
const FR = path.join(OUT, "frames");
fs.mkdirSync(FR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SCENES = [
  { k: "open", say: "A warranty only pays if you can prove two dates: when you bought the thing, and how long the cover runs. Warranty Claim Packet is a skill for UGREEN A.I. NAS that proves both, from files you already have." },
  { k: "problem", say: "The invoice is a P.D.F. in Downloads. The paper receipt is a phone photo in the backup. The manual is somewhere else, and the serial number is on a label you photographed once. The NAS is the one place all of them end up." },
  { k: "flow", say: "Nine steps, each delegated to a registered UGOS expert. The file agent finds invoices and manuals. The photo agent finds receipt and label photos and reads them with the local model. The document agent extracts purchase records and quotes the warranty clause. Nothing is written until you approve." },
  { k: "skill", say: "The skill is pure orchestration. Values carried between steps are named, and replaced only with real expert results. If one is missing, the dependent step stops instead of guessing. Every delegation handles completed, failed, cancelled, waiting for the user, and waiting for approval." },
  { k: "rules", say: "Coverage follows written rules: calendar month terms, month end dates, a sixty day expiring soon window, separate parts and motor terms, and registration only extensions. A missing term is reported as term unknown, never assumed." },
  { k: "check", say: "Here is the official Uliya skill kit checker, run on the package. Static pass, zero errors, zero warnings. GitHub Actions downloads the kit and runs the same check on every push." },
  { k: "proposal", say: "Round one is this proposal and the skill package. If we reach round two, we test both modes on a real i D X six zero one one Pro: a ledger over seeded purchases, a full claim packet, and an illegible receipt that must stop cleanly." },
  { k: "outro", say: "Warranty Claim Packet. Your receipts, joined into a verdict you can send. Open source, M.I.T. licensed." },
];

function voice() {
  const dur = {};
  for (const s of SCENES) {
    const f = path.join(OUT, `${s.k}.wav`);
    const r = spawnSync("python", ["-m", "piper", "-m", VOICE, "-f", f, "--length-scale", "0.98", "--sentence-silence", "0.3"], { input: s.say, encoding: "utf8" });
    if (r.status !== 0) throw new Error("piper: " + r.stderr);
    dur[s.k] = Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], { encoding: "utf8" }).stdout.trim());
  }
  return dur;
}

function runChecker() {
  const kit = path.join(ROOT, "kit/uliya-skill-kit/scripts/check-skill.mjs");
  const r = spawnSync("node", [kit, "warranty-claim-packet"], { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) throw new Error("checker did not pass: " + r.stdout + r.stderr);
  // colour the status line the way a terminal user would see it highlighted
  return r.stdout.trimEnd().replace('"static-pass"', "\x1b[1;32m\"static-pass\"\x1b[0m");
}

const CAP_CSS = `#cap{position:fixed;left:50%;bottom:10px;transform:translateX(-50%);width:min(1240px,94vw);background:rgba(8,12,10,.9);color:#f2f6f3;
  font:500 18px/1.35 system-ui,sans-serif;padding:9px 16px;border-radius:10px;z-index:99999;text-align:center;pointer-events:none;border:1px solid rgba(255,255,255,.08)}`;

async function main() {
  const checkOut = runChecker();
  const dur = voice();
  console.log("narration seconds", Object.values(dur).reduce((a, b) => a + b, 0).toFixed(1));
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", defaultViewport: { width: 1536, height: 864, deviceScaleFactor: 1.25 }, args: ["--no-first-run", "--lang=en-US", "--force-color-profile=srgb"] });
  const page = await browser.newPage();
  const prep = () => page.evaluate((css) => { if (!document.getElementById("cap")) { const st = document.createElement("style"); st.textContent = css; document.head.append(st); const c = document.createElement("div"); c.id = "cap"; document.body.append(c); } }, CAP_CSS);
  const caption = (t) => page.evaluate((t) => { const c = document.getElementById("cap"); if (c) { c.textContent = t; c.style.display = t ? "block" : "none"; } }, t);
  const scrollTo = (sel) => page.evaluate((sel) => { const all = [...document.querySelectorAll("h1,h2,h3,h4,p,strong,a,td,div.markdown-heading")]; const e = all.find((x) => x.textContent.trim().startsWith(sel)); if (e) window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - 90, behavior: "smooth" }); return !!e; }, sel);
  const glide = async (px, ms) => { const steps = Math.max(1, Math.round(ms / 50)); for (let i = 0; i < steps; i++) { await page.evaluate((d) => window.scrollBy(0, d), px / steps); await sleep(50); } };

  await page.goto("about:blank");
  const cdp = await page.createCDPSession();
  const frames = []; let n = 0;
  cdp.on("Page.screencastFrame", async (f) => { const file = path.join(FR, `${String(n++).padStart(6, "0")}.jpg`); fs.writeFileSync(file, Buffer.from(f.data, "base64")); frames.push({ file, ts: f.metadata.timestamp }); cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {}); });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 88, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });

  const scenes = [];
  let cur = "open";
  const go = async (url, wait = "networkidle2") => { await page.goto(url, { waitUntil: wait }); await prep().catch(() => {}); await caption(SCENES.find((s) => s.k === cur).say).catch(() => {}); };
  const scene = async (k, fn) => {
    cur = k;
    const t = Date.now() / 1000;
    await prep().catch(() => {}); await caption(SCENES.find((s) => s.k === k).say).catch(() => {});
    const end = t + dur[k] + 0.5;
    await fn().catch((e) => console.log("scene", k, e.message));
    await prep().catch(() => {}); await caption(SCENES.find((s) => s.k === k).say).catch(() => {});
    while (Date.now() / 1000 < end) { await sleep(100); }
    scenes.push({ k, start: t, end: Date.now() / 1000 });
  };
  const thumb = pathToFileURL(path.join(ROOT, "proposal/thumb.html")).href;

  await scene("open", async () => { await go(thumb, "load"); });
  await scene("problem", async () => { await go(REPO); await scrollTo("Warranty Claim Packet"); await sleep(2500); await glide(260, 3000); });
  await scene("flow", async () => { await scrollTo("How it works"); await sleep(1500); await glide(320, 9000); });
  await scene("skill", async () => {
    await go(`${REPO}/blob/main/warranty-claim-packet/SKILL.md`);
    await scrollTo("Values carried between steps"); await sleep(5000);
    await scrollTo("Step 4. Read purchase details"); await sleep(4500);
    await scrollTo("Completion and failure"); await glide(200, 3000);
  });
  await scene("rules", async () => { await go(`${REPO}/blob/main/warranty-claim-packet/references/coverage-rules.md`); await scrollTo("Expiry date"); await sleep(4500); await scrollTo("Edge cases"); await glide(150, 3000); });
  await scene("check", async () => {
    await page.goto(pathToFileURL(path.join(ROOT, "scripts/demo/term.html")).href, { waitUntil: "networkidle0" });
    await page.evaluate((out) => window.play("node kit/uliya-skill-kit/scripts/check-skill.mjs warranty-claim-packet", out, "uliya-skill-kit 0.7.3 static check"), checkOut);
  });
  await scene("proposal", async () => { await go(pathToFileURL(path.join(ROOT, "proposal/proposal.html")).href, "load"); await page.evaluate(() => { document.body.style.maxWidth = "1400px"; document.body.style.margin = "30px auto 160px"; document.querySelectorAll("body > :not(#cap):not(style)").forEach((e) => { e.style.zoom = "1.6"; }); }); await sleep(3000); await glide(1500, 11000); });
  await scene("outro", async () => { await go(thumb, "load"); });

  await cdp.send("Page.stopScreencast"); await browser.close();

  frames.sort((a, b) => a.ts - b.ts);
  const t0 = scenes[0].start, tEnd = scenes.at(-1).end;
  const use = frames.filter((f) => f.ts >= t0 - 0.05 && f.ts <= tEnd);
  const list = [];
  for (let i = 0; i < use.length; i++) { const b = i + 1 < use.length ? use[i + 1].ts : tEnd; list.push(`file '${use[i].file.replace(/\\/g, "/")}'`, `duration ${Math.max(0.001, b - use[i].ts).toFixed(4)}`); }
  list.push(`file '${use.at(-1).file.replace(/\\/g, "/")}'`);
  fs.writeFileSync(path.join(OUT, "frames.txt"), list.join("\n"));
  const args = ["-y", "-f", "concat", "-safe", "0", "-i", path.join(OUT, "frames.txt")];
  scenes.forEach((s) => args.push("-i", path.join(OUT, `${s.k}.wav`)));
  const delays = scenes.map((s, i) => `[${i + 1}:a]adelay=${Math.round((s.start - t0) * 1000)}|${Math.round((s.start - t0) * 1000)}[a${i}]`).join(";");
  const mix = scenes.map((_, i) => `[a${i}]`).join("") + `amix=inputs=${scenes.length}:normalize=0,apad[aout]`;
  args.push("-filter_complex", `${delays};${mix};[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p[vout]`,
    "-map", "[vout]", "-map", "[aout]", "-t", (tEnd - t0).toFixed(2), "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-c:a", "aac", "-b:a", "160k", path.join(OUT, "warranty-claim-packet-demo.mp4"));
  const r = spawnSync("ffmpeg", args, { encoding: "utf8", maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error("ffmpeg: " + r.stderr.slice(-2500));
  console.log("video", path.join(OUT, "warranty-claim-packet-demo.mp4"), "seconds", (tEnd - t0).toFixed(1), "frames", use.length);
}
main().catch((e) => { console.error(e); process.exit(1); });
