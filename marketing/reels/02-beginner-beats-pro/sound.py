# Sound for reel 2: a tight kinetic-type beat (133 bpm) with paper slams on every hard cut.
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "shared"))
from sfx import Mix, kick, hat, clap, snap, whoosh, boom, chime, blip, tick, pad, saw_bass, note  # noqa: E402

m = Mix(16.0, seed=12)
B = 0.45  # one beat
# hook: three slams on the beat, ink-on-paper
for at in (0.12, 0.57, 1.02):
    m.add(snap(m), at, 1.0); m.add(kick(0.5, 140, 40), at, 0.9)
m.add(boom(m, 1.2), 1.02, 0.5)
m.add(whoosh(m, 0.4), 2.1, 0.5)
# groove from the first cut to the end card
bassline = ["A1", "A1", "F1", "G1"]
k = 0
at = 2.4
while at < 13.15:
    m.add(kick(), at, 0.85)
    if k % 2 == 1: m.add(clap(m), at, 0.35, pan=0.1)
    m.add(hat(m), at + B / 2, 0.18, pan=0.35)
    m.add(saw_bass(note(bassline[(k // 4) % 4]), B * 0.9), at, 0.35)
    at += B; k += 1
# the strike-through and the switch to LIMITLINE
m.add(whoosh(m, 0.35, up=False), 4.95, 0.35, pan=-0.3)
m.add(whoosh(m, 0.3), 5.9, 0.4); m.add(blip(1600), 6.05, 0.3)
# bars growing past the limit: rising counter ticks
for i in range(14):
    m.add(blip(700 + i * 55, 0.05), 7.2 + i * 0.085, 0.18, pan=0.2)
# Maya takes #1
m.add(whoosh(m, 0.45), 8.45, 0.5)
for f, d in (("A4", 0), ("C#5", 0.02), ("E5", 0.04), ("A5", 0.06)):
    m.add(chime(note(f), 1.4, 3.5), 8.68 + d, 0.18)
# board rows slide in
for i in range(5):
    m.add(tick(m), 10.15 + i * 0.12, 0.6); m.add(blip(900 + i * 120, 0.05), 10.15 + i * 0.12, 0.15)
m.add(whoosh(m, 0.4), 9.75, 0.45)
# end: two slams on black, then the mark
m.add(boom(m, 1.0), 13.2, 0.8); m.add(snap(m), 13.2, 0.8)
m.add(boom(m, 1.0), 13.6, 0.8); m.add(snap(m), 13.6, 0.8)
m.add(boom(m, 2.0), 14.5, 0.8)
for i, f in enumerate(("E5", "A5", "C#6", "E6")):
    m.add(chime(note(f), 1.2, 4), 14.75 + i * 0.04, 0.12, pan=0.3)
m.add(pad([note("A1"), note("E2"), note("A2"), note("C#3"), note("E3")], 2.6, 1.4), 13.4, 0.55)
m.write(os.path.join(os.path.dirname(os.path.abspath(__file__)), "sound.wav"))
print("ok")
