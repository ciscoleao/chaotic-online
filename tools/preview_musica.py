#!/usr/bin/env python3
"""Renderiza 64s da música do pátio v180 (dark sci-fi ambient, estilo Sub-Zero).

Loop 32s (Dm9→Bbmaj9→Dm9→A7sus) x2: pads saw escuros + drone Ré + baixo +
arpejos de vidro + SOLO saw c/ eco vasto (A G|F D|E C|D E) + pings de gelo +
abertura Ré–Lá–Ré. A emenda do loop cai em t=32s. Mesmos timbres da engine.
Uso: python3 preview_musica.py  (gera previews/musica_lobby_preview.wav)
Caminhos relativos à raiz do pacote (funciona no workspace e em lobby/tools/).
"""
import os
import wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = HERE if os.path.basename(HERE) != 'tools' else os.path.dirname(HERE)
OUT = os.path.join(ROOT, 'previews', 'musica_lobby_preview.wav')

SR = 22050
DUR = 64.0
CHORD_DUR = 8.0
CHORDS = [
    [146.83, 174.61, 220.00, 261.63, 329.63],
    [116.54, 174.61, 220.00, 261.63, 293.66],
    [146.83, 174.61, 220.00, 261.63, 329.63],
    [110.00, 196.00, 293.66, 329.63, 440.00],
]
MELODY = [
    [(2.0, 440.00), (5.0, 392.00)],
    [(2.0, 349.23), (5.0, 293.66)],
    [(2.0, 329.63), (5.0, 261.63)],
    [(2.0, 293.66), (5.0, 329.63)],
]
BELLS = [587.33, 659.25, 698.46, 783.99, 880.00, 1046.50, 1174.66, 1318.51]
OPENING = [(0.5, 587.33), (1.3, 880.00), (2.1, 1174.66)]
MASTER = (40 / 100) ** 1.5 * 0.6  # = volume 40% na curva do jogo

n = int(SR * DUR)
mix = np.zeros(n)


def saw(t, freq, n_harm=6):
    s = np.zeros_like(t)
    for k in range(1, n_harm + 1):
        s += np.sin(2 * np.pi * freq * k * t) / k
    return s * 0.6


def add_note(freq, t0, dur, peak, attack, sustain_until, wave_fn, echo=0.0):
    i0 = int(t0 * SR)
    nn = int(dur * SR)
    if i0 >= n:
        return None
    nn = min(nn, n - i0)
    t = np.arange(nn) / SR
    sig = wave_fn(t, freq)
    na = min(int(attack * SR), nn)
    env = np.ones(nn)
    env[:na] = 10 ** (np.linspace(-4, 0, na))
    rel = min(max(int(sustain_until * SR), na), nn - 1)
    env[rel:] = 10 ** (np.linspace(0, -4, nn - rel))
    note = peak * sig * env
    mix[i0:i0 + nn] += note
    if echo > 0:
        for k, amp in ((1, 0.5), (2, 0.5 ** 2), (3, 0.5 ** 3)):
            e0 = i0 + int(k * 0.65 * SR)
            if e0 < n:
                m = min(nn, n - e0)
                mix[e0:e0 + m] += note[:m] * amp * echo
    return i0


def add_pluck(freq, t0, dur, peak, harm2=0.0, echo=0.0):
    i0 = int(t0 * SR)
    nn = min(int(dur * SR), n - i0)
    if i0 >= n or nn <= 0:
        return
    t = np.arange(nn) / SR
    sig = np.sin(2 * np.pi * freq * t)
    if harm2:
        sig = sig + harm2 * np.sin(2 * np.pi * freq * 2 * t)
    env = np.exp(-t / (dur / 3.2)) * (1 - np.exp(-t / 0.012))
    note = peak * sig * env
    mix[i0:i0 + nn] += note
    if echo > 0:
        for k, amp in ((1, 0.5), (2, 0.5 ** 2), (3, 0.5 ** 3)):
            e0 = i0 + int(k * 0.65 * SR)
            if e0 < n:
                m = min(nn, n - e0)
                mix[e0:e0 + m] += note[:m] * amp * echo


sine = lambda t, f: np.sin(2 * np.pi * f * t)  # noqa: E731

# drone sub-grave em Ré
add_note(73.42, 0.1, DUR, 0.03, 4.0, DUR - 4, sine)
add_note(110.00, 0.1, DUR, 0.012, 4.0, DUR - 4, sine)

# acordes: pads saw + baixo + vidros + solo (+ abertura no 1º)
t = 0.1
ci = 0
while t < DUR:
    ch = CHORDS[ci % len(CHORDS)]
    for f in ch:
        add_note(f, t, CHORD_DUR + 3, 0.04, 3.5, CHORD_DUR, saw)
    add_pluck(ch[0], t + 0.05, 4.0, 0.075, harm2=0.25)  # baixo sub
    for i in range(4):  # arpejos de vidro
        add_pluck(ch[i], t + 0.5 + i * 1.0, 1.6, 0.04, harm2=0.25, echo=0.25)
    for off, f in MELODY[ci % len(MELODY)]:  # solo saw c/ eco vasto
        add_note(f, t + off, 4.0, 0.07, 0.5, 2.5, saw, echo=0.2)
    if ci == 0:  # abertura: sinal Ré–Lá–Ré
        for off, f in OPENING:
            add_pluck(f, t + off, 2.6, 0.07, harm2=0.3, echo=1.0)
    t += CHORD_DUR
    ci += 1

# pings de gelo raros + eco vasto
rng = np.random.default_rng(7)
bi = 4
t = 3.1
bell_count = 0
while t < DUR:
    if rng.random() < 0.06:
        bi += int(rng.integers(-2, 3))
        bi = max(0, min(len(BELLS) - 1, bi))
        add_pluck(BELLS[bi], t, 2.6, 0.07, harm2=0.3, echo=1.0)
        bell_count += 1
    t += 1.0

# fade de entrada 4s (igual à engine: começa baixinho)
nf = int(4 * SR)
mix[:nf] *= np.linspace(0, 1, nf)
# fade-out de 1.5s só p/ o arquivo-demo não clicar no fim
no = int(1.5 * SR)
mix[-no:] *= np.linspace(1, 0, no)
mix *= MASTER
# normaliza a PREVIA p/ avaliacao confortavel (no jogo ela toca baixinha como fundo)
mix *= 0.45 / max(float(np.abs(mix).max()), 1e-6)
peak = float(np.abs(mix).max())
rms = float(np.sqrt((mix ** 2).mean()))

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with wave.open(OUT, 'wb') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
print(f'OK: {OUT} ({DUR}s, peak={peak:.3f}, rms={rms:.4f}, pings={bell_count})')
