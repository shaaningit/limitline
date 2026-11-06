# LIMITLINE ad reel

A 24-second vertical ad (1080×1920, 30 fps) for Instagram Reels, TikTok and YouTube Shorts.
Every frame is drawn with code: shapes, gradients and shading, no photos or pixel art.
The look borrows from 3D explainer videos: a clay-shaded mannequin, soft studio light,
camera pushes and big word-by-word captions.

| Time | Scene | Caption |
| --- | --- | --- |
| 0–7 s | A mannequin runs at a glowing line marked YOUR LIMIT and smashes through it. The timer flips from 25:58 to 24:58 | "What happens when you BEAT your own LIMIT?" |
| 7–11 s | X-ray view: the heart pumping at 150 bpm | "Your heart pumps up to 20 LITRES of blood a minute" |
| 11–14.5 s | Muscle fibres strain, tear slightly and grow back thicker | "Your muscles ADAPT and come back STRONGER" |
| 14.5–18.5 s | A 3D phone shows the app: +3.9% beyond your limit | "LIMITLINE measures you against your OWN best" |
| 18.5–21.5 s | Embers fly from the phone into a shopping bag, and gear pops out | "Earn EMBERS. Spend them on REAL GEAR." |
| 21.5–24 s | The logo draws itself | "Cross your limit." |

## Files

- `reel.js`: the whole animation. `render(ctx, t)` draws the frame at time `t`, and the same time
  always gives the same picture.
- `sound.py`: makes the sound track from plain sine waves and noise (needs numpy).
- `limitline-cross-the-line.mp4`: the finished video. `cover.jpg`: a thumbnail frame.

Rebuild it with the shared tools in [`../README.md`](../README.md).

## Before posting

- The heart figure (up to about 20 litres a minute at peak effort for trained athletes) is a
  commonly cited physiology number. Keep the "up to" wording.
- Instagram covers roughly the bottom fifth of the screen with its own buttons. The captions
  sit just above that area.
