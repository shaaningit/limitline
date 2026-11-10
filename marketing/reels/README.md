# LIMITLINE reels

Seven vertical videos (1080×1920, 30 fps, with sound) for Instagram Reels, TikTok and YouTube Shorts.
Everything is drawn in code from shapes and gradients: no photos, stock footage or pixel art.
Every athlete reel sells one promise and ends on it: **Beat your limit. Get rewarded.**
Each one uses a different style and hook, so the launch can test which one people respond to.

| Reel | Length | Style | Hook |
| --- | --- | --- | --- |
| [05 Get sponsored](05-get-sponsored/) | 17.5 s | Sports campaign: spotlight, shaded jersey, slanted type | Pros get sponsors. Now you can win brand gear too |
| [06 Pays you back](06-pays-you-back/) | 16 s | Fake screen recording of the app with TikTok caption boxes | POV: your workouts start paying you back |
| [07 How to get gear](07-how-to-get-gear/) | 15 s | Loud volt tutorial with chunky toy-like 3D objects | How to get gear for working out, in 3 steps |
| [02 Beginner beats a pro](02-beginner-beats-pro/) | 17 s | Light poster: huge condensed type, hard cuts | The board ranks effort, so a beginner can win |
| [01 Cross the line](01-cross-the-line/) | 24 s | 3D explainer: clay mannequin, x-ray heart, muscle fibres | What happens when you beat your limit? |
| [03 Ghost race](03-ghost-race/) | 16 s | 3D night city, chase camera | I raced myself from last month |
| [04 For brands](04-for-brands/) | 19 s | Glass cards floating in 3D, editorial headlines | For sponsors: email and LinkedIn |

Each folder has `limitline-<name>.mp4` (the finished video), `cover.jpg` (a thumbnail frame),
`reel.js` (the animation) and `sound.py` (the sound track, made from sine waves and noise).
Posting plan and captions: [`../CAMPAIGN.md`](../CAMPAIGN.md).

## Watch one live

Open `player.html?r=02-beginner-beats-pro` in a browser (serve the folder or open the file directly).

## Rebuild a video

Needs Node with Playwright, Python 3 with numpy, and ffmpeg.

```bash
cd marketing/reels
python3 02-beginner-beats-pro/sound.py
NODE_PATH=$(npm root -g) node export.cjs 02-beginner-beats-pro
```

The exporter renders every frame, encodes the video, then adds the sound levelled to about
-14 LUFS (the loudness Instagram and TikTok play at). To check a few frames without a full render:

```bash
./sheet.sh 02-beginner-beats-pro 1,4.5,9,14
```

## Files shared by all reels

- `shared/common.js`: easing, captions, film grain, the logo mark and the end card.
- `shared/sfx.py`: the little synth (kick, claps, whooshes, chimes, pads) every `sound.py` uses.
- `player.html` and `export.cjs`: play a reel live, or render it to MP4.
