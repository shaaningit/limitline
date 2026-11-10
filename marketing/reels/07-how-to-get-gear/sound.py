# Sound for reel 7: bouncy and playful (128 bpm). Slams on the hook words, a thwack per quest
# card, a crack when the bar breaks the limit, and a pop and sparkle when the gift box opens.
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "shared"))
from sfx import Mix, kick, hat, clap, snap, whoosh, boom, chime, blip, pad, saw_bass, riser, t_, note  # noqa: E402
import numpy as np

m = Mix(15.0, seed=77)
B = 60 / 128
def boing(d=0.35):
    t = t_(d); f = 220 + 260 * np.exp(-t * 9) * (1 + 0.3 * np.sin(2 * np.pi * 18 * t))
    return np.sin(2 * np.pi * np.cumsum(f) / 48000) * np.exp(-t * 7)
for at in (0.1, 0.45, 0.8): m.add(snap(m), at, 0.9); m.add(kick(0.4, 150, 45), at, 0.8)
m.add(boing(), 1.0, 0.35); m.add(snap(m), 1.2, 0.6); m.add(blip(1400), 1.22, 0.25)
for k in range(4): m.add(boing(0.25), 1.2 + k * 0.31, 0.16)
at = 2.4; k = 0
roots = ["E1", "E1", "C2", "D2"]
while at < 12.2:
    m.add(kick(0.35, 120, 45), at, 0.8)
    if k % 2 == 1: m.add(clap(m), at, 0.35)
    m.add(hat(m, 0.03, 120), at + B / 2, 0.14, pan=0.4)
    m.add(saw_bass(note(roots[(k // 4) % 4]) * (2 if k % 2 else 1), B * 0.8, 0.05), at, 0.35)
    at += B; k += 1
for c in (2.4, 5.7, 9.0): m.add(whoosh(m, 0.35), c - 0.2, 0.45)
# step 1: cards land, one gets picked
for i in range(4): m.add(snap(m), 2.4 + 0.45 + i * 0.18, 0.5, pan=(-0.4, 0.4)[i % 2])
m.add(blip(1600), 4.3, 0.3); m.add(chime(note("E6"), 0.5, 8), 4.32, 0.15)
# step 2: the bar fills, then cracks the limit
m.add(riser(m, 1.3, 180, 2.5), 6.3, 0.3)
m.add(boom(m, 1.2), 7.6, 0.6); m.add(snap(m), 7.6, 0.9)
for i in range(10): m.add(chime(note(("B6", "E7", "G#6")[i % 3]), 0.25, 14), 7.62 + i * 0.03, 0.06, pan=(-1) ** i * 0.6)
m.add(snap(m), 7.95, 0.6)
# step 3: the box opens, gear and embers burst out
m.add(snap(m), 9.2, 0.5)
m.add(kick(0.3, 200, 60), 9.9, 0.7); m.add(clap(m), 9.9, 0.4)
for i, f in enumerate(("E5", "G#5", "B5", "E6", "G#6")): m.add(chime(note(f), 0.8, 5), 10.0 + i * 0.06, 0.14)
for i in range(3): m.add(boing(0.25), 10.0 + i * 0.12, 0.12)
# end card
m.add(whoosh(m, 0.4), 12.15, 0.35)
m.add(boom(m, 2.0), 12.72, 0.85)
for i, f in enumerate(("E5", "G#5", "B5", "E6")): m.add(chime(note(f), 1.5, 3), 12.95 + i * 0.05, 0.12)
m.add(pad([note("E2"), note("B2"), note("E3"), note("G#3"), note("B3")], 2.6, 1.4), 12.4, 0.55)
m.write(os.path.join(os.path.dirname(os.path.abspath(__file__)), "sound.wav"))
print("ok")
