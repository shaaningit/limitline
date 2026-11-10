# Sound for reel 6: a light, upbeat loop like a creator's video, with phone sounds on top:
# notification pings, coin pickups as embers fly into the balance, taps, and a redeem pop.
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "shared"))
from sfx import Mix, kick, hat, clap, whoosh, boom, chime, blip, tick, pad, pluck, saw_bass, note  # noqa: E402

m = Mix(16.0, seed=66)
B = 0.5  # 120 bpm
chords = [["C3", "E3", "G3", "B3"], ["A2", "C3", "E3", "G3"], ["F2", "A2", "C3", "E3"], ["G2", "B2", "D3", "F3"]]
roots = ["C2", "A1", "F1", "G1"]
at = 0.0; k = 0
while at < 13.1:
    bar = (k // 4) % 4
    m.add(kick(0.35, 90, 48), at, 0.55)
    if k % 2 == 1: m.add(clap(m), at, 0.25)
    m.add(hat(m, 0.03, 110), at + B / 2, 0.12, pan=0.4)
    m.add(saw_bass(note(roots[bar]), B * 0.9, 0.035), at, 0.3)
    m.add(pluck(note(chords[bar][k % 4]) * 2, 0.6, 0.4), at + (B / 2 if k % 2 else 0), 0.14, pan=-0.3)
    at += B; k += 1
# each workout: notification ping, checked tick, embers fly and land
for a in (0.8, 3.0, 5.2):
    m.add(chime(note("E6"), 0.4, 9), a, 0.18); m.add(chime(note("B6"), 0.5, 9), a + 0.09, 0.15)
    m.add(blip(1900, 0.05), a + 0.8, 0.2)
    for i in range(6): m.add(blip(800 + i * 140, 0.05), a + 0.9 + i * 0.05, 0.12)
    m.add(whoosh(m, 0.4), a + 1.25, 0.25, pan=0.5)
    m.add(chime(note("C6"), 0.5, 7), a + 1.75, 0.2); m.add(chime(note("G6"), 0.5, 7), a + 1.8, 0.16)
# tab tap, shop slides in
m.add(tick(m), 7.85, 0.6); m.add(whoosh(m, 0.35), 8.1, 0.3)
m.add(tick(m), 9.4, 0.6); m.add(whoosh(m, 0.4, up=False), 9.55, 0.3)
# redeem: tap, pop, sparkle
m.add(tick(m), 10.85, 0.6)
m.add(kick(0.3, 180, 60), 11.0, 0.6); m.add(clap(m), 11.0, 0.4)
for i, f in enumerate(("C6", "E6", "G6", "C7")): m.add(chime(note(f), 0.8, 5), 11.02 + i * 0.05, 0.15)
# end card
m.add(whoosh(m, 0.4), 12.95, 0.35)
m.add(boom(m, 2.0), 13.52, 0.85)
for i, f in enumerate(("C5", "E5", "G5", "C6")): m.add(chime(note(f), 1.5, 3), 13.75 + i * 0.05, 0.12)
m.add(pad([note("C2"), note("G2"), note("C3"), note("E3"), note("G3")], 2.8, 1.4), 13.2, 0.55)
m.write(os.path.join(os.path.dirname(os.path.abspath(__file__)), "sound.wav"))
print("ok")
