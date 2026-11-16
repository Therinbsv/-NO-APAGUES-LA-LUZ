#!/usr/bin/env python3
"""
generate_audio.py — Sintetiza TODO el audio de "NO APAGUES LA LUZ".

Uso (desde la raíz del proyecto):
    pip install numpy
    python3 tools/generate_audio.py

Produce archivos .wav (16 bit, mono, 22.05 kHz) en public/assets/audio/.
Los sonidos son originales (síntesis aditiva + ruido filtrado), por lo que no
hay problemas de licencias. Las músicas están construidas para repetirse en
bucle sin cortes audibles.
"""
import os
import wave
import numpy as np

SR = 22050
rng = np.random.default_rng(2026)
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "assets", "audio")


# ------------------------------------------------------------------ utilidades
def t_axis(dur):
    return np.arange(int(SR * dur)) / SR


def fft_filter(x, lo=None, hi=None):
    """Filtro de banda por FFT (fase cero). lo/hi en Hz."""
    spec = np.fft.rfft(x)
    freqs = np.fft.rfftfreq(len(x), 1 / SR)
    mask = np.ones_like(freqs)
    if lo is not None:
        mask *= 1 / (1 + (lo / np.maximum(freqs, 1e-3)) ** 4)
    if hi is not None:
        mask *= 1 / (1 + (freqs / hi) ** 4)
    return np.fft.irfft(spec * mask, n=len(x))


def noise(dur):
    return rng.standard_normal(int(SR * dur))


def exp_env(dur, tau, attack=0.003):
    t = t_axis(dur)
    env = np.exp(-t / tau)
    a = int(SR * attack)
    if a > 0:
        env[:a] *= np.linspace(0, 1, a)
    return env


def sine(f, dur, phase=0.0):
    return np.sin(2 * np.pi * f * t_axis(dur) + phase)


def saw(f, dur):
    t = t_axis(dur)
    return 2 * ((f * t) % 1.0) - 1


def square(f, dur):
    return np.sign(np.sin(2 * np.pi * f * t_axis(dur)))


def sweep(f0, f1, dur, wave_fn="sine"):
    t = t_axis(dur)
    f = f0 + (f1 - f0) * (t / dur)
    ph = 2 * np.pi * np.cumsum(f) / SR
    if wave_fn == "saw":
        return 2 * ((ph / (2 * np.pi)) % 1.0) - 1
    return np.sin(ph)


def normalize(x, peak=0.9):
    m = np.max(np.abs(x)) or 1.0
    return x / m * peak


def place(buf, sig, at):
    i = int(SR * at)
    end = min(len(buf), i + len(sig))
    if i < len(buf):
        buf[i:end] += sig[: end - i]


def write_wav(rel_path, x, peak=0.9):
    x = normalize(np.asarray(x, dtype=np.float64), peak)
    data = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    path = os.path.join(ROOT, rel_path)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
    print(f"  {rel_path:<38} {len(x)/SR:5.1f}s  {os.path.getsize(path)//1024:5d} KB")


def circular_echo(x, delay, gain, taps=4):
    """Eco circular: mantiene el bucle sin cortes."""
    out = x.copy()
    for k in range(1, taps + 1):
        out += gain**k * np.roll(x, int(SR * delay * k))
    return out


def bell(freq, dur, tau=0.7, bright=1.0):
    """Timbre de caja de música: parciales con ligera inarmonicidad."""
    t = t_axis(dur)
    partials = [(1, 1.0), (2.0, 0.42 * bright), (3.01, 0.22 * bright), (4.2, 0.12 * bright), (5.4, 0.05 * bright)]
    sig = sum(a * np.sin(2 * np.pi * freq * m * t) * np.exp(-t / (tau / (1 + 0.5 * i))) for i, (m, a) in enumerate(partials))
    attack = int(SR * 0.002)
    sig[:attack] *= np.linspace(0, 1, attack)
    return sig


NOTE = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}


def hz(name):
    """'A4' -> 440 Hz"""
    pitch, octave = name[:-1], int(name[-1])
    n = NOTE[pitch] + 12 * (octave - 4) - 9
    return 440.0 * 2 ** (n / 12)


# ------------------------------------------------------------------ efectos
def sfx_click():
    x = fft_filter(noise(0.05), lo=1500) * exp_env(0.05, 0.008)
    x += 0.5 * sine(1400, 0.05) * exp_env(0.05, 0.012)
    return x


def sfx_pickup():
    buf = np.zeros(int(SR * 0.6))
    place(buf, bell(880, 0.5, 0.25, 0.6), 0.0)
    place(buf, bell(1318.5, 0.5, 0.3, 0.6), 0.09)
    return buf


def sfx_battery():
    x = sweep(260, 980, 0.32, "saw") * exp_env(0.32, 0.25)
    x = fft_filter(x, hi=2500)
    buf = np.zeros(int(SR * 0.5))
    place(buf, x, 0)
    place(buf, bell(1568, 0.3, 0.12), 0.3)
    return buf


def sfx_flash_click():
    buf = np.zeros(int(SR * 0.16))
    place(buf, (fft_filter(noise(0.04), lo=900) * exp_env(0.04, 0.007) + 0.6 * sine(700, 0.04) * exp_env(0.04, 0.01)), 0)
    place(buf, (fft_filter(noise(0.04), lo=1400) * exp_env(0.04, 0.006) + 0.5 * sine(1100, 0.04) * exp_env(0.04, 0.008)), 0.07)
    return buf


def sfx_hiss():
    dur = 0.9
    t = t_axis(dur)
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    x = fft_filter(noise(dur), lo=2500, hi=9000) * env
    growl = saw(95, dur) * (0.6 + 0.4 * np.sin(2 * np.pi * 23 * t)) * env * 0.5
    return x + fft_filter(growl, hi=700)


def sfx_growl():
    dur = 1.4
    t = t_axis(dur)
    f = 58 + 6 * np.sin(2 * np.pi * 5 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = (2 * ((ph / (2 * np.pi)) % 1) - 1) * (0.7 + 0.3 * np.sin(2 * np.pi * 17 * t))
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.8
    x = fft_filter(x + 0.25 * noise(dur), hi=420) * env
    return x


def sfx_jumpscare():
    dur = 1.3
    t = t_axis(dur)
    chord = sum(saw(f, dur) for f in (110, 116.5, 233, 466.7, 880.5))
    chord = fft_filter(chord, hi=3500) * np.exp(-t / 0.55)
    burst = fft_filter(noise(dur), lo=300) * np.exp(-t / 0.18)
    x = chord * 0.7 + burst * 1.3
    return np.tanh(x * 2.2)


def sfx_phone_ring():
    buf = np.zeros(int(SR * 2.2))
    for start in (0.0, 0.55, 1.2, 1.75):
        d = 0.4
        t = t_axis(d)
        tone = (np.sin(2 * np.pi * 440 * t) + np.sin(2 * np.pi * 480 * t)) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 20 * t)))
        place(buf, tone * exp_env(d, 0.4, 0.01), start)
    return buf


def sfx_phone_buzz():
    buf = np.zeros(int(SR * 1.2))
    for start in (0.0, 0.3, 0.6):
        d = 0.2
        x = fft_filter(square(165, d) + 0.5 * square(330, d), hi=1200) * exp_env(d, 0.2, 0.005)
        place(buf, x, start)
    return buf


def sfx_thunder():
    dur = 3.4
    t = t_axis(dur)
    n = fft_filter(noise(dur), hi=240)
    env = np.exp(-t / 1.1) * (1 + 0.6 * np.sin(2 * np.pi * 3.3 * t) * np.exp(-t / 1.5))
    crack = fft_filter(noise(0.25), lo=500) * exp_env(0.25, 0.04)
    buf = n * env * 1.6
    place(buf, crack * 0.6, 0.0)
    return buf


def sfx_door():
    dur = 1.4
    t = t_axis(dur)
    f = 130 + 150 * (t / dur) ** 1.4 + 6 * np.sin(2 * np.pi * 9 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    creak = (2 * ((ph / (2 * np.pi)) % 1) - 1)
    creak = fft_filter(creak, lo=200, hi=1400) * np.sin(np.pi * t / dur) ** 0.7
    creak += 0.25 * fft_filter(noise(dur), lo=300, hi=1800) * np.sin(np.pi * t / dur)
    thud = sine(70, 0.3) * exp_env(0.3, 0.07)
    buf = np.zeros(int(SR * 1.7))
    place(buf, creak, 0)
    place(buf, thud * 0.9, 1.35)
    return buf


def sfx_generator_start():
    dur = 3.2
    t = t_axis(dur)
    rate = 3 + 22 * (t / dur) ** 1.6  # pulsos que se aceleran
    pulses = (0.55 + 0.45 * np.sign(np.sin(2 * np.pi * np.cumsum(rate) / SR))) * np.minimum(1, t / 0.2)
    f = 38 + 22 * (t / dur) ** 1.2
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = (2 * ((ph / (2 * np.pi)) % 1) - 1) + 0.5 * np.sin(3 * ph)
    x = fft_filter(body, hi=700) * pulses
    x += 0.15 * fft_filter(noise(dur), hi=600) * pulses
    return x * np.minimum(1, (dur - t) / 0.4 + 0.5)


def sfx_generator_hum():
    dur = 2.0  # 50 Hz * 2 s = 100 ciclos enteros -> bucle perfecto
    t = t_axis(dur)
    x = sum(a * np.sin(2 * np.pi * f * t) for f, a in ((50, 1.0), (100, 0.6), (150, 0.35), (200, 0.15)))
    x += 0.1 * np.sin(2 * np.pi * 25 * t)
    return x * (0.85 + 0.15 * np.sin(2 * np.pi * 4 * t))


def sfx_success():
    buf = np.zeros(int(SR * 1.2))
    for i, n in enumerate(("C5", "E5", "G5", "C6")):
        place(buf, bell(hz(n), 0.9, 0.5, 0.7), i * 0.11)
    return buf


def sfx_error():
    x = (square(150, 0.28) + 0.7 * square(113, 0.28))
    x = fft_filter(x, hi=1500) * exp_env(0.28, 0.2, 0.004)
    return x


def sfx_heartbeat():
    dur = 1.0
    buf = np.zeros(int(SR * dur))
    place(buf, sine(58, 0.22) * exp_env(0.22, 0.06), 0.0)
    place(buf, 0.75 * sine(52, 0.22) * exp_env(0.22, 0.07), 0.26)
    return buf


def sfx_paper():
    d = 0.3
    t = t_axis(d)
    x = fft_filter(noise(d), lo=900, hi=5500) * (np.sin(np.pi * t / d) ** 2) * (0.6 + 0.4 * np.sin(2 * np.pi * 38 * t))
    return x


def sfx_footstep():
    d = 0.11
    return fft_filter(noise(d), hi=380) * exp_env(d, 0.03, 0.002) + 0.4 * sine(95, d) * exp_env(d, 0.03)


def sfx_blip():
    return sine(920, 0.025) * exp_env(0.025, 0.01, 0.002)


def sfx_tape():
    d = 0.9
    t = t_axis(d)
    whirr = fft_filter(noise(d), lo=1200, hi=4500) * 0.3 * (0.7 + 0.3 * np.sin(2 * np.pi * 14 * t))
    click = np.zeros(int(SR * d))
    place(click, fft_filter(noise(0.03), lo=500) * exp_env(0.03, 0.006), 0.0)
    place(click, fft_filter(noise(0.03), lo=500) * exp_env(0.03, 0.006), 0.85)
    return whirr * np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.05) + click * 1.2


# ------------------------------------------------------------------ músicas
def music_box(melody, tempo, tail=2.5, bass=None, detune=1.0, total_beats=None):
    """Construye una melodía de caja de música. melody=[(nota|None, pulsos)]"""
    beat = 60.0 / tempo
    total = (total_beats if total_beats else sum(b for _, b in melody)) * beat
    buf = np.zeros(int(SR * (total + tail)))
    pos = 0.0
    for name, beats in melody:
        if name:
            f = hz(name)
            place(buf, bell(f, 2.4, 0.9) * 0.9, pos * beat)
            if detune != 1.0:  # segunda voz desafinada = sonido "embrujado"
                place(buf, bell(f * 2 * detune, 1.8, 0.6, 0.5) * 0.28, pos * beat)
        pos += beats
    if bass:
        pos = 0.0
        for name, beats in bass:
            if name:
                place(buf, bell(hz(name), 3.0, 1.2, 0.4) * 0.7, pos * beat)
            pos += beats
    loop_len = int(SR * total)
    # "pliega" la cola sobre el inicio para que el bucle no tenga corte
    head = buf[:loop_len].copy()
    tail_part = buf[loop_len:]
    head[: len(tail_part)] += tail_part
    return circular_echo(head, 0.36, 0.42, taps=3)


def music_menu():
    # La menor, 6/8 lento: nana inquietante.
    m = [
        ("E5", 1.5), ("D5", 0.75), ("C5", 0.75), ("B4", 1.5), ("A4", 1.5),
        ("C5", 1.5), ("B4", 0.75), ("A4", 0.75), ("G#4", 1.5), ("E4", 1.5),
        ("A4", 1.5), ("C5", 0.75), ("E5", 0.75), ("A5", 1.5), ("G5", 1.5),
        ("F5", 1.5), ("E5", 0.75), ("D5", 0.75), ("E5", 3.0),
        ("E5", 1.5), ("F5", 0.75), ("E5", 0.75), ("D5", 1.5), ("C5", 1.5),
        ("D5", 1.5), ("C5", 0.75), ("B4", 0.75), ("G#4", 1.5), ("B4", 1.5),
        ("A4", 3.0), (None, 3.0),
    ]
    bass = [("A2", 3.0), ("E3", 3.0), ("A2", 3.0), ("F2", 3.0), ("A2", 3.0), ("E3", 3.0), ("A2", 6.0)]
    return music_box(m, tempo=74, bass=bass, detune=1.006)


def music_ending():
    # La mayor, esperanzador: la misma nana "iluminada".
    m = [
        ("E5", 1.5), ("F#5", 0.75), ("G#5", 0.75), ("A5", 1.5), ("E5", 1.5),
        ("C#5", 1.5), ("D5", 0.75), ("E5", 0.75), ("B4", 3.0),
        ("A4", 1.5), ("C#5", 0.75), ("E5", 0.75), ("A5", 1.5), ("G#5", 1.5),
        ("F#5", 1.5), ("E5", 0.75), ("D5", 0.75), ("E5", 3.0),
        ("C#5", 1.5), ("E5", 1.5), ("A5", 3.0),
        (None, 3.0),
    ]
    bass = [("A2", 3.0), ("E3", 3.0), ("A2", 3.0), ("D3", 3.0), ("A2", 3.0), ("E3", 3.0)]
    return music_box(m, tempo=66, bass=bass, detune=1.0)


def music_ambient():
    L = 24.0  # segundos del bucle
    t = t_axis(L)
    # Frecuencias con número entero de ciclos en L => bucle perfecto.
    drone = 0.0
    for f, a in ((55.0, 1.0), (82.5, 0.45), (110.0, 0.5), (164.5, 0.12)):
        drone = drone + a * np.sin(2 * np.pi * f * t + f)
    drone *= 0.75 + 0.25 * np.sin(2 * np.pi * (3 / L) * t)  # respiración lenta
    whine = 0.05 * np.sin(2 * np.pi * 1320.0 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * (2 / L) * t + 1))
    whine += 0.03 * np.sin(2 * np.pi * 1397.0 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * (3 / L) * t))
    # Viento: ruido filtrado con fundido cruzado para cerrar el bucle.
    xf = int(SR * 2)
    w = fft_filter(noise(L + 2), lo=180, hi=900)
    wind = w[: int(SR * L)].copy()
    fade = np.linspace(0, 1, xf)
    wind[:xf] = wind[:xf] * fade + w[int(SR * L): int(SR * L) + xf] * (1 - fade)
    wind *= 0.35 + 0.65 * (0.5 + 0.5 * np.sin(2 * np.pi * (4 / L) * t - 1))
    x = drone * 0.55 + whine + wind * 0.55
    # Golpes graves lejanos (se envuelven al inicio).
    for at in (6.8, 15.5, 20.2):
        thump = fft_filter(noise(2.5), hi=120) * np.exp(-t_axis(2.5) / 0.5) * 1.4
        idx = int(SR * at)
        seg = np.roll(np.concatenate([thump, np.zeros(len(x) - len(thump))]), idx)
        x += seg * 0.8
    return x


# ------------------------------------------------------------------ principal
def main():
    print("Generando audio en", os.path.normpath(ROOT))
    music = {
        "music/menu_lullaby.wav": (music_menu(), 0.8),
        "music/ambient_drone.wav": (music_ambient(), 0.85),
        "music/ending_light.wav": (music_ending(), 0.8),
    }
    sounds = {
        "click": sfx_click, "pickup": sfx_pickup, "battery": sfx_battery, "flash_click": sfx_flash_click,
        "hiss": sfx_hiss, "growl": sfx_growl, "jumpscare": sfx_jumpscare, "phone_ring": sfx_phone_ring,
        "phone_buzz": sfx_phone_buzz, "thunder": sfx_thunder, "door": sfx_door,
        "generator_start": sfx_generator_start, "generator_hum": sfx_generator_hum, "success": sfx_success,
        "error": sfx_error, "heartbeat": sfx_heartbeat, "paper": sfx_paper, "footstep": sfx_footstep,
        "blip": sfx_blip, "tape": sfx_tape,
    }
    for rel, (sig, peak) in music.items():
        write_wav(rel, sig, peak)
    for name, fn in sounds.items():
        write_wav(f"sounds/{name}.wav", fn(), 0.9)


if __name__ == "__main__":
    main()
