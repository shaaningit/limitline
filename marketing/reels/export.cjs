/* eslint-disable @typescript-eslint/no-require-imports */
// Renders a reel frame by frame with Playwright and pipes the frames into ffmpeg.
//   node export.cjs 02-beginner-beats-pro            full video (and muxes sound.wav if present)
//   node export.cjs 02-beginner-beats-pro 1,4.5,9    just those frames, as shot-<t>.jpg, for checking
// Playwright must be installed (NODE_PATH=$(npm root -g) works with a global install).
const { chromium } = require("playwright");
const { spawn, execFileSync } = require("child_process");
const fs = require("fs"), path = require("path");
(async () => {
  const dir = process.argv[2], only = process.argv[3], out = path.join(__dirname, dir);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto("file://" + path.join(__dirname, "player.html") + "?export&r=" + dir);
  await p.evaluate(() => window.ready);
  const grab = (t, q) => p.evaluate(([t, q]) => { window.renderAt(t); return document.getElementById("c").toDataURL("image/jpeg", q); }, [t, q]).then((d) => Buffer.from(d.split(",")[1], "base64"));
  if (only) {
    for (const t of only.split(",").map(Number)) fs.writeFileSync(path.join(out, `shot-${t}.jpg`), await grab(t, 0.85));
  } else {
    const DUR = await p.evaluate(() => window.Reel.DUR), COVER = await p.evaluate(() => window.Reel.COVER ?? 1);
    fs.writeFileSync(path.join(out, "cover.jpg"), await grab(COVER, 0.9));
    const video = path.join(out, "video.mp4");
    const ff = spawn("ffmpeg", ["-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", "30", "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", video], { stdio: ["pipe", "inherit", "inherit"] });
    const N = Math.round(DUR * 30);
    for (let f = 0; f < N; f++) {
      if (!ff.stdin.write(await grab(f / 30, 0.95))) await new Promise((r) => ff.stdin.once("drain", r));
      if (f % 150 === 0) console.log(dir, "frame", f, "/", N);
    }
    ff.stdin.end(); await new Promise((r) => ff.on("close", r));
    const wav = path.join(out, "sound.wav");
    if (fs.existsSync(wav)) {
      execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", video, "-i", wav, "-c:v", "copy", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", path.join(out, `limitline-${dir.replace(/^\d+-/, "")}.mp4`)]);
    }
  }
  console.log(errs.join("\n") || "no page errors");
  await b.close();
})();
