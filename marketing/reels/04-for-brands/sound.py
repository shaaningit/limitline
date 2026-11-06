# Sound for reel 4: calm and premium. Soft plucked chords at 100 bpm, a light kick,
# glassy pops for every card, and a stamp when the reward is earned.
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "shared"))
from sfx import Mix, kick, hat, whoosh, boom, chime, blip, tick, pad, pluck, snap, note  # noqa: E402

m = Mix(19.0, seed=44)
B = 0.6
prog = [["D3", "F#3", "A3", "C#4"], ["B2", "D3", "F#3", "A3"], ["G2", "B2", "D3", "F#3"], ["A2", "C#3", "E3", "G3"]]
k = 0; at = 0.0
while at < 16.1:
    bar = (k // 4) % 4
    ch = prog[bar]
    if k % 4 == 0:
        m.add(pad([note(n) / 2 for n in ch], B * 4.2, 1.0, attack=0.3, release=0.6, dark=0.03), at, 0.45)
    # a gentle broken chord on every beat
    m.add(pluck(note(ch[k % 4]) * 2, 0.9, 0.45), at, 0.2, pan=-0.3 + 0.2 * (k % 4))
    if at >= 3.0:
        m.add(kick(0.35, 70, 50), at, 0.5)
        m.add(hat(m, 0.03, 120), at + B / 2, 0.08, pan=0.4)
    at += B; k += 1
# card arrivals and scene changes
m.add(whoosh(m, 0.7), 0.4, 0.35)
for c in (3.0, 6.6, 10.2, 13.6):
    m.add(whoosh(m, 0.4), c - 0.25, 0.3, pan=0.2)
    m.add(chime(note("A5"), 0.6, 7), c + 0.05, 0.08)
for i in range(6):
    m.add(blip(1200 + i * 90, 0.06), 7.1 + i * 0.28, 0.2, pan=0.3)
    m.add(tick(m), 7.35 + i * 0.28, 0.35)
for i in range(6):
    m.add(blip(900 + i * 110, 0.06), 10.4 + i * 0.14, 0.2, pan=-0.3)
# the reward: pedestal rises, price lands, stamp
m.add(boom(m, 1.2), 13.65, 0.35)
m.add(blip(1600), 14.25, 0.25)
m.add(snap(m), 15.0, 0.9); m.add(kick(0.4, 120, 45), 15.0, 0.7)
# end card
m.add(whoosh(m, 0.4), 15.95, 0.35)
m.add(boom(m, 2.0), 16.52, 0.8)
for i, f in enumerate(("D5", "F#5", "A5", "D6")):
    m.add(chime(note(f), 1.6, 3), 16.75 + i * 0.05, 0.12)
m.add(pad([note("D2"), note("A2"), note("D3"), note("F#3"), note("A3")], 2.8, 1.4), 16.2, 0.55)
m.write(os.path.join(os.path.dirname(os.path.abspath(__file__)), "sound.wav"))
print("ok")
