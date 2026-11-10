# Sound for reel 5: a stadium swell for the pros, dead air and a buzzing light for "nothing",
# then a stomp-stomp-clap groove as brand patches slap onto the jersey.
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "shared"))
from sfx import Mix, kick, clap, snap, whoosh, boom, chime, blip, pad, riser, lp, t_, note  # noqa: E402
import numpy as np

m = Mix(17.5, seed=55)
# pros: a bright brass-like chord and a crowd roar (filtered noise swell)
m.add(pad([note("D3"), note("F#3"), note("A3"), note("D4")], 2.7, 1.2, attack=0.15, release=0.2, dark=0.12), 0.0, 0.6)
crowd = lp(m.noise(2.7), 0.06) * np.sin(np.pi * t_(2.7) / 2.7) ** 0.5
m.add(crowd, 0.0, 0.5)
for at in (0.2, 0.65): m.add(boom(m, 1.0), at, 0.5); m.add(snap(m), at, 0.6)
# "you get... nothing": one low note and a buzzing light
m.add(pad([note("D2"), note("F2")], 2.1, 1.0, attack=0.05, release=0.8), 2.6, 0.35)
buzz = np.sign(np.sin(2 * np.pi * 100 * t_(2.1))) * 0.05 * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * t_(2.1)))
m.add(lp(buzz, 0.2), 2.6, 0.4)
m.add(snap(m), 3.6, 0.4)
# "until now": hit, then the groove drops
m.add(snap(m), 4.85, 0.7); m.add(kick(0.5, 140, 40), 4.85, 0.8)
m.add(boom(m, 2.0), 5.15, 1.0)
m.add(pad([note("D2"), note("A2"), note("D3"), note("F#3")], 9.3, 0.9, attack=0.4), 5.15, 0.4)
B = 0.6  # stomp, stomp, clap
at = 5.75; k = 0
while at < 14.3:
    step = k % 2
    m.add(kick(0.4, 60, 45), at, 0.8); m.add(kick(0.4, 60, 45), at + B / 3, 0.8)
    m.add(clap(m), at + 2 * B / 3, 0.55)
    at += B; k += 1
# each quest: card whoosh, result stamp, patch slap, reward toast
for b in (6.9, 8.7, 10.5):
    m.add(whoosh(m, 0.35), b - 0.15, 0.35, pan=-0.4)
    m.add(snap(m), b + 0.5, 0.7); m.add(blip(1800, 0.08), b + 0.52, 0.2)
    m.add(snap(m), b + 0.9, 1.0); m.add(kick(0.3, 160, 50), b + 0.9, 0.9)
    m.add(chime(note("A5"), 0.8, 5), b + 1.0, 0.18); m.add(chime(note("D6"), 0.8, 5), b + 1.04, 0.12)
# "like a pro": lights up
m.add(riser(m, 0.8, 300, 2), 11.5, 0.3)
m.add(boom(m, 1.6), 12.25, 0.7)
for i, f in enumerate(("D5", "F#5", "A5", "D6")): m.add(chime(note(f), 1.4, 3.5), 12.3 + i * 0.04, 0.13)
# end card
m.add(whoosh(m, 0.4), 14.3, 0.4)
m.add(boom(m, 2.0), 14.92, 0.9)
for i, f in enumerate(("D5", "F#5", "A5", "D6")): m.add(chime(note(f), 1.6, 3), 15.15 + i * 0.05, 0.12)
m.add(pad([note("D2"), note("A2"), note("D3"), note("F#3"), note("A3")], 2.4, 1.4), 14.6, 0.55)
m.write(os.path.join(os.path.dirname(os.path.abspath(__file__)), "sound.wav"))
print("ok")
