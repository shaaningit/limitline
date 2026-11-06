# Sound design for the LIMITLINE reel, synthesised from scratch (no samples).
import os, wave
import numpy as np
SR = 48000; DUR = 24.0; N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rs = np.random.default_rng(7)
def t_(d): return np.arange(int(SR * d)) / SR
def add(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR); j = min(N, i + len(sig))
    if j <= i: return
    s = sig[: j - i] * gain
    L[i:j] += s * np.sqrt((1 - pan) / 2); R[i:j] += s * np.sqrt((1 + pan) / 2)
def lp(x, a):  # one-pole low-pass, a in (0,1): smaller = darker
    y = np.empty_like(x); acc = 0.0
    for k in range(len(x)): acc += a * (x[k] - acc); y[k] = acc
    return y
def kick(d=0.45):
    t = t_(d); f = 45 + 110 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
def hat(d=0.05):
    t = t_(d); n = rs.standard_normal(len(t)); n = n - lp(n, 0.3)
    return n * np.exp(-t * 90)
def whoosh(d=0.55, up=True):
    t = t_(d); n = rs.standard_normal(len(t)); env = np.sin(np.pi * t / d) ** 2
    cut = np.linspace(0.02, 0.35, len(t)) if up else np.linspace(0.35, 0.02, len(t))
    y = np.empty_like(n); acc = 0.0
    for k in range(len(n)): acc += cut[k] * (n[k] - acc); y[k] = acc
    return y * env
def boom(d=2.2):
    t = t_(d); f = 32 + 70 * np.exp(-t * 6)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.8)
    n = rs.standard_normal(len(t)); crash = lp(n, 0.25) * np.exp(-t * 4)
    return sub * 1.0 + crash * 0.5
def shatter(d=1.4):
    out = np.zeros(int(SR * d))
    for _ in range(26):
        at = rs.uniform(0, 0.6) ** 1.6; fr = rs.uniform(2500, 7000); t = t_(0.25)
        s = np.sin(2 * np.pi * fr * t) * np.exp(-t * rs.uniform(18, 40)) * rs.uniform(0.2, 0.5)
        i = int(at * SR); out[i:i + len(s)] += s[: len(out) - i]
    return out
def heartbeat():
    def thump(f0, d=0.18):
        t = t_(d); f = f0 + 40 * np.exp(-t * 30)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 22)
    out = np.zeros(int(SR * 0.5)); a = thump(55); b = thump(48) * 0.7
    out[: len(a)] += a; i = int(0.14 * SR); out[i:i + len(b)] += b
    return out
def chime(f, d=0.9):
    t = t_(d)
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.01 * t) + 0.15 * np.sin(2 * np.pi * f * 3 * t)) * np.exp(-t * 6)
def blip(f, d=0.07):
    t = t_(d); return np.sin(2 * np.pi * f * t) * np.exp(-t * 50)
def riser(d):
    t = t_(d); f = 120 * (2 ** (t / d * 3))
    saw = 2 * ((np.cumsum(f) / SR) % 1) - 1; n = rs.standard_normal(len(t)) * 0.3
    return (lp(saw, 0.08) + lp(n, 0.2)) * (t / d) ** 2
def pad(notes, d, gain=1.0):
    t = t_(d); y = np.zeros(len(t))
    for i, f in enumerate(notes):
        for det in (-0.6, 0.6):
            y += np.sin(2 * np.pi * (f + det) * t + i)
    att = np.minimum(1, t / 1.2); rel = np.minimum(1, (d - t) / 1.0)
    return lp(y, 0.05) * att * rel * gain / len(notes)

TC = 5.93
# Scene 1: dark pad, a beat that tightens, a riser into the crossing
add(pad([55, 82.4, 110], 6.6), 0.0, 0.5)
for k in range(11):  # quarter notes 120 bpm from 0.5 s
    at = 0.5 + k * 0.5
    if at < TC - 0.1: add(kick(), at, 0.9)
for k in range(22):
    at = 0.75 + k * 0.25
    if 2.5 < at < TC - 0.05: add(hat(), at, 0.22 + 0.1 * (at > 4.2), pan=0.3 if k % 2 else -0.3)
add(riser(2.0), TC - 2.0, 0.35)
# the crossing: impact, glass, then a slow-motion underwater drone
add(boom(), TC, 1.0); add(shatter(), TC, 0.6, pan=0.2); add(shatter(), TC + 0.03, 0.5, pan=-0.3)
add(pad([41.2, 61.7], 1.3, 1.2), TC + 0.1, 0.5)
# cuts
for at in (7.0, 11.0, 14.5, 18.5, 21.5): add(whoosh(0.5), at - 0.3, 0.45, pan=-0.2)
# Scene 2: heartbeat at 150 bpm under a red drone
add(pad([65.4, 98], 4.0), 7.0, 0.35)
for k in range(10): add(heartbeat(), 7.25 + k * 0.4, 0.95)
# Scene 3: tension creak, then a deep "stronger" thump
t3 = t_(2.1); creak = lp(rs.standard_normal(len(t3)), 0.03) * np.sin(2 * np.pi * (6 + 10 * t3) * t3) * (t3 / 2.1)
add(creak, 11.4, 0.9)
add(kick(0.8), 13.25, 1.0); add(chime(220, 1.4), 13.25, 0.25)
add(pad([73.4, 110, 146.8], 3.4), 11.05, 0.3)
# Scene 4: the phone. UI tick, count-up blips, a ding at the result
add(pad([55, 82.4, 110, 164.8], 7.0), 14.5, 0.45)
for k in range(14): add(kick(), 14.5 + k * 0.5, 0.75)
for k in range(28): add(hat(), 14.75 + k * 0.25, 0.18, pan=0.3 if k % 2 else -0.3)
add(blip(1400), 14.9, 0.3)
for k in range(12): add(blip(900 + k * 60), 15.4 + k * 0.1, 0.22)
add(chime(880), 16.6, 0.35); add(chime(1318.5), 16.62, 0.2)
# Scene 5: embers land in the bag, matching the picture (same seeded timing as reel.js)
def mulberry32(seed):
    def r():
        nonlocal seed
        seed = (seed + 0x6D2B79F5) & 0xFFFFFFFF; t = seed
        t = ((t ^ (t >> 15)) * (1 | t)) & 0xFFFFFFFF
        t = (t + (((t ^ (t >> 7)) * (61 | t)) & 0xFFFFFFFF)) ^ t
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296
    return r
r = mulberry32(21); gems = []
for _ in range(16): d = r() * 1.1; r(); r(); r(); gems.append(d)
scale = [1046.5, 1174.7, 1318.5, 1568, 1760]
for i, d in enumerate(sorted(gems)): add(chime(scale[i % 5], 0.5), 18.5 + 0.4 + d + 0.7, 0.16, pan=0.4)
for k, at in enumerate((20.55, 20.67, 20.79)): add(blip(600 + k * 200, 0.12), at, 0.35)
add(riser(1.1), 20.5, 0.4)
# Scene 6: the mark slams in, sparks, a wide final chord
add(boom(2.0), 21.82, 0.9); add(shatter(1.0), 22.05, 0.35)
add(pad([55, 82.4, 110, 138.6, 164.8], 2.4, 1.4), 21.6, 0.55)
mix = np.stack([L, R], 1)
mix /= np.max(np.abs(mix)) * 1.12
fade = np.minimum(1, (DUR - np.arange(N) / SR) / 0.6)[:, None]
mix = np.tanh(mix * 1.3) / np.tanh(1.3) * fade * 0.9
with wave.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "sound.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print("ok")
