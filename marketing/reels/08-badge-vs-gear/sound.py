# Sound for reel 8: odometer clicks that speed up then settle, a sad "womp" for the badge,
# then a riser, a drop and a confident beat as real gear lands, ending on the waitlist.
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "shared"))
from sfx import Mix, kick, hat, clap, snap, whoosh, boom, chime, blip, tick, pad, riser, saw_bass, t_, note  # noqa: E402
import numpy as np

m = Mix(16.0, seed=81)
m.add(pad([note("A1"), note("E2"), note("A2")], 3.2, 1.0, attack=0.3), 0.0, 0.45)
# odometer: clicks bunch up mid-count (easeInOut), then stop on 1,000
ts = np.linspace(0, 1, 60)
for x in ts:
    at = 0.3 + 2.3 * (0.5 - np.cos(np.pi * x) / 2) ** 1.0
    m.add(tick(m), at, 0.25 + 0.2 * np.sin(np.pi * x), pan=0.3)
m.add(chime(note("A5"), 0.6, 6), 2.62, 0.2)
# the badge: tiny "tink" landings and a sad womp
for i, at in enumerate((3.65, 3.85, 3.97)):
    m.add(chime(note("E6"), 0.25, 18), at, 0.18 / (i + 1))
t = t_(1.0); f = 220 * np.exp(-t * 0.9)
womp = np.sin(2 * np.pi * np.cumsum(f) / 48000) * np.exp(-t * 2.2) * (1 + 0.25 * np.sin(2 * np.pi * 6 * t))
m.add(womp, 4.1, 0.4)
# the turn
m.add(riser(m, 1.0, 150, 2.5), 4.65, 0.3)
m.add(boom(m, 1.6), 5.6, 0.9); m.add(snap(m), 5.6, 0.7)
B = 60 / 120
roots = ["A1", "F1", "C2", "G1"]
k = 0; at = 5.6
while at < 12.3:
    m.add(kick(), at, 0.8)
    if k % 2 == 1: m.add(clap(m), at, 0.3)
    m.add(hat(m, 0.04), at + B / 2, 0.14, pan=0.4)
    m.add(saw_bass(note(roots[(k // 4) % 4]), B * 0.9, 0.04), at, 0.35)
    at += B; k += 1
for c, d in ((5.75, 6.3), (6.55, 7.1)):
    m.add(whoosh(m, 0.35), c - 0.1, 0.3, pan=-0.4); m.add(blip(1700, 0.06), d, 0.25)
for i in range(10): m.add(chime(note(("C6", "E6", "G6")[i % 3]), 0.4, 9), 8.2 + i * 0.07, 0.07, pan=0.3)
# the badge gets knocked away, gear lands
m.add(whoosh(m, 0.4), 8.9, 0.4)
for i, at in enumerate((9.5, 9.75, 10.0, 10.25)):
    m.add(kick(0.35, 150, 50), at, 0.7); m.add(snap(m), at, 0.4)
    m.add(chime(note(("A5", "C#6", "E6", "A6")[i]), 0.9, 5), at + 0.02, 0.14)
# end card
m.add(whoosh(m, 0.4), 12.15, 0.35)
m.add(boom(m, 2.0), 12.65, 0.85)
for i, f in enumerate(("A5", "C#6", "E6", "A6")): m.add(chime(note(f), 1.5, 3), 12.85 + i * 0.05, 0.12)
m.add(blip(1400, 0.1), 13.95, 0.3); m.add(chime(note("E6"), 0.8, 5), 13.97, 0.15)
m.add(pad([note("A1"), note("E2"), note("A2"), note("C#3"), note("E3")], 3.4, 1.4), 12.4, 0.55)
m.write(os.path.join(os.path.dirname(os.path.abspath(__file__)), "sound.wav"))
print("ok")
