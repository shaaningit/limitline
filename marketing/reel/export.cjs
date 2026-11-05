/* eslint-disable @typescript-eslint/no-require-imports */
// Renders every frame of the reel with Playwright and pipes them into ffmpeg.
// Run with: NODE_PATH=$(npm root -g) node export.cjs  (or with playwright installed locally)
const { chromium } = require('playwright'); const { spawn } = require('child_process');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + __dirname + '/reel.html'); await p.evaluate(() => window.ready);
  const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', __dirname + '/video.mp4'], { stdio: ['pipe', 'inherit', 'inherit'] });
  const N = 24 * 30;
  for (let f = 0; f < N; f++) {
    const d = await p.evaluate(t => { window.renderAt(t); return document.getElementById('c').toDataURL('image/jpeg', 0.95); }, f / 30);
    if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 120 === 0) console.log('frame', f);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close(); console.log('done');
})();
