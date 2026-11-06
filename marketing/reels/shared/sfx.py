"""Tiny synth kit for the LIMITLINE reels. Every sound is made from sine waves and noise,
so there are no samples or licences to worry about. Needs numpy only."""
import wave
import numpy as np

SR = 48000


class Mix:
    def __init__(self, dur, seed=7):
        self.dur = dur
        self.n = int(SR * dur)
        self.L = np.zeros(self.n)
        self.R = np.zeros(self.n)
        self.rs = np.random.default_rng(seed)

    def add(self, sig, at, gain=1.0, pan=0.0):
        i = int(at * SR)
        j = min(self.n, i + len(sig))
        if j <= i or i < 0:
            return
        s = sig[: j - i] * gain
        self.L[i:j] += s * np.sqrt((1 - pan) / 2)
        self.R[i:j] += s * np.sqrt((1 + pan) / 2)

    def noise(self, d):
        return self.rs.standard_normal(int(SR * d))

    def write(self, path, drive=1.3, fade=0.6):
        mix = np.stack([self.L, self.R], 1)
        mix /= np.max(np.abs(mix)) * 1.12
        f = np.minimum(1, (self.dur - np.arange(self.n) / SR) / fade)[:, None]
        mix = np.tanh(mix * drive) / np.tanh(drive) * f * 0.9
        with wave.open(path, "wb") as w:
            w.setnchannels(2)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes((mix * 32767).astype("<i2").tobytes())


def t_(d):
    return np.arange(int(SR * d)) / SR


def lp(x, a):
    """One-pole low-pass (a in 0..1, smaller is darker), applied in the frequency domain."""
    n = len(x)
    m = 1 << int(np.ceil(np.log2(n + SR // 10)))
    w = np.fft.rfftfreq(m) * 2 * np.pi
    h = a / (1 - (1 - a) * np.exp(-1j * w))
    return np.fft.irfft(np.fft.rfft(x, m) * h, m)[:n]


def hp(x, a):
    return x - lp(x, a)


def sweep_lp(x, a0, a1):
    """Low-pass whose cutoff glides from a0 to a1 (for whooshes and risers)."""
    cut = np.linspace(a0, a1, len(x))
    y = np.empty_like(x)
    acc = 0.0
    for k in range(len(x)):
        acc += cut[k] * (x[k] - acc)
        y[k] = acc
    return y


def env_ad(d, attack=0.005, decay=8.0):
    t = t_(d)
    return np.minimum(1, t / attack) * np.exp(-t * decay)


def kick(d=0.45, punch=110, base=45):
    t = t_(d)
    f = base + punch * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)


def hat(mix, d=0.05, decay=90):
    t = t_(d)
    return hp(mix.noise(d), 0.3) * np.exp(-t * decay)


def clap(mix, d=0.25):
    t = t_(d)
    n = hp(mix.noise(d), 0.15)
    e = np.exp(-t * 18) + 0.6 * np.exp(-np.maximum(0, t - 0.012) * 30) * (t > 0.012)
    return n * e


def snap(mix, d=0.09):
    """A dry paper/ink slam: a noise burst with a body thump."""
    t = t_(d)
    return hp(mix.noise(d), 0.25) * np.exp(-t * 60) + np.sin(2 * np.pi * 180 * t) * np.exp(-t * 40) * 0.8


def whoosh(mix, d=0.55, up=True):
    t = t_(d)
    env = np.sin(np.pi * t / d) ** 2
    a0, a1 = (0.02, 0.35) if up else (0.35, 0.02)
    return sweep_lp(mix.noise(d), a0, a1) * env


def boom(mix, d=2.2):
    t = t_(d)
    f = 32 + 70 * np.exp(-t * 6)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.8)
    crash = lp(mix.noise(d), 0.25) * np.exp(-t * 4)
    return sub + crash * 0.5


def chime(f, d=0.9, decay=6):
    t = t_(d)
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.01 * t) + 0.15 * np.sin(2 * np.pi * f * 3 * t)) * np.exp(-t * decay)


def pluck(f, d=0.6, bright=0.5):
    """A soft piano-ish pluck."""
    t = t_(d)
    y = sum((bright ** (k - 1)) * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (4 + 3 * k)) for k in range(1, 6))
    return y * np.minimum(1, t / 0.003)


def blip(f, d=0.07):
    t = t_(d)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 50)


def tick(mix, d=0.02):
    t = t_(d)
    return hp(mix.noise(d), 0.5) * np.exp(-t * 300)


def riser(mix, d, f0=120, octaves=3):
    t = t_(d)
    f = f0 * (2 ** (t / d * octaves))
    saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
    return (lp(saw, 0.08) + lp(mix.noise(d) * 0.3, 0.2)) * (t / d) ** 2


def pad(notes, d, gain=1.0, attack=1.2, release=1.0, dark=0.05):
    t = t_(d)
    y = np.zeros(len(t))
    for i, f in enumerate(notes):
        for det in (-0.6, 0.6):
            y += np.sin(2 * np.pi * (f + det) * t + i)
    a = np.minimum(1, t / attack)
    r = np.minimum(1, (d - t) / release)
    return lp(y, dark) * a * np.maximum(r, 0) * gain / len(notes)


def saw_bass(f, d, cutoff=0.04):
    t = t_(d)
    saw = 2 * ((f * t) % 1) - 1
    return lp(saw, cutoff) * np.minimum(1, t / 0.01) * np.exp(-t * 3)


def arp_note(f, d=0.22):
    t = t_(d)
    sq = np.sign(np.sin(2 * np.pi * f * t)) * 0.5 + np.sin(2 * np.pi * f * 2 * t) * 0.3
    return lp(sq, 0.12) * np.exp(-t * 9) * np.minimum(1, t / 0.004)


def note(name):
    """'A2' -> Hz."""
    names = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4, "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2}
    n, o = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((names[n] + (o - 4) * 12) / 12)
