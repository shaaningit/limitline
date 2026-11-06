# Sound for reel 3: a night-drive synth pulse (120 bpm) with a ticking race clock,
# a whoosh as you pass the ghost, and a shimmer as it dissolves.
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "shared"))
from sfx import Mix, kick, hat, clap, whoosh, boom, chime, blip, tick, pad, saw_bass, arp_note, riser, sweep_lp, note  # noqa: E402

m = Mix(16.0, seed=31)
B = 0.5
# fly-in: wind falling into the streets
m.add(sweep_lp(m.noise(2.6), 0.25, 0.02) * 0.6, 0.0, 0.5)
m.add(pad([note("A1"), note("E2"), note("A2")], 3.0, 1.2, attack=0.4), 0.0, 0.5)
chords = [["A2", "C3", "E3"], ["F2", "A2", "C3"], ["C3", "E3", "G3"], ["G2", "B2", "D3"]]
roots = ["A1", "F1", "C2", "G1"]
k = 0; at = 2.5
while at < 12.95:
    bar = (k // 8) % 4
    m.add(kick(), at, 0.8 if at < 10.0 else 0.4)
    if k % 2 == 1 and at < 10.0: m.add(clap(m), at, 0.25)
    m.add(hat(m, 0.04), at + B / 2, 0.14, pan=0.4)
    m.add(saw_bass(note(roots[bar]), B * 0.95, 0.03), at, 0.4)
    # arpeggio: up through the chord, sixteenth notes
    ch = chords[bar]
    for s in range(4):
        n = note(ch[s % 3]) * (2 if s == 3 else 1) * 2
        m.add(arp_note(n), at + s * B / 4, 0.09, pan=-0.3 + 0.2 * s)
    at += B; k += 1
# the race clock ticking every half second while behind
for i in range(22):
    tt = 2.6 + i * 0.25
    if tt < 7.9: m.add(tick(m), tt, 0.35, pan=0.5)
# the pass: whoosh, flash chord, the ghost turns to light
m.add(whoosh(m, 0.6), 7.55, 0.7, pan=-0.2)
m.add(boom(m, 1.4), 8.0, 0.45)
for i, f in enumerate(("A4", "C#5", "E5", "A5")):
    m.add(chime(note(f), 1.6, 3), 8.02 + i * 0.03, 0.15)
for i in range(18):
    m.add(chime(note(("E6", "A6", "C#7", "B6")[i % 4]), 0.5, 7), 8.25 + i * 0.06, 0.05, pan=(-1) ** i * 0.5)
# pull out to the whole loop, the stats card lands
m.add(riser(m, 1.2, 200, 2), 9.9, 0.25)
m.add(whoosh(m, 0.9, up=False), 10.0, 0.4)
m.add(blip(1500), 10.65, 0.3); m.add(blip(2000), 10.72, 0.2)
m.add(pad([note("A1"), note("E2"), note("A2"), note("C#3")], 3.0, 1.3), 10.0, 0.5)
# end card
m.add(whoosh(m, 0.4), 12.75, 0.4)
m.add(boom(m, 2.0), 13.32, 0.9)
for i, f in enumerate(("E5", "A5", "C#6", "E6")):
    m.add(chime(note(f), 1.4, 3.5), 13.55 + i * 0.05, 0.12)
m.add(pad([note("A1"), note("E2"), note("A2"), note("C#3"), note("E3")], 2.8, 1.4), 13.1, 0.55)
m.write(os.path.join(os.path.dirname(os.path.abspath(__file__)), "sound.wav"))
print("ok")
