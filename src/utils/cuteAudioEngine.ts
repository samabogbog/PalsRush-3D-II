// 100% Procedural Web Audio API Cute & Soft Sound Engine (BGM + SFX)
// Designed with warm sine/triangle waves, gentle attack envelopes, and a master low-pass warmth filter
// so every sound is cozy, pastel, and soothing on the ears ("เสียงน่ารักๆนุ่มๆไม่บาดหู").

class CuteAudioEngine {
  private ctx: AudioContext | null = null;
  private masterFilter: BiquadFilterNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private isMuted = false;
  private bgmTimer: number | null = null;
  private bgmStep = 0;
  private isBgmPlaying = false;
  private listeners: Set<(muted: boolean) => void> = new Set();

  constructor() {
    try {
      const saved = localStorage.getItem('pals_rush_audio_muted');
      if (saved === '1') {
        this.isMuted = true;
      }
    } catch {
      // ignore storage errors
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      // Master warm low-pass filter to roll off any harsh high frequencies (> 1950 Hz)
      this.masterFilter = this.ctx.createBiquadFilter();
      this.masterFilter.type = 'lowpass';
      this.masterFilter.frequency.value = 1950;
      this.masterFilter.Q.value = 0.5;
      this.masterFilter.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.isMuted ? 0 : 0.24;
      this.sfxGain.connect(this.masterFilter);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = this.isMuted ? 0 : 0.085;
      this.bgmGain.connect(this.masterFilter);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlockAndStartBgm(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (!this.isBgmPlaying) {
      this.startBgmLoop();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public subscribe(cb: (muted: boolean) => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    try {
      localStorage.setItem('pals_rush_audio_muted', muted ? '1' : '0');
    } catch {
      // ignore
    }
    const ctx = this.ensureContext();
    if (ctx && this.sfxGain && this.bgmGain) {
      const now = ctx.currentTime;
      this.sfxGain.gain.setTargetAtTime(muted ? 0 : 0.24, now, 0.04);
      this.bgmGain.gain.setTargetAtTime(muted ? 0 : 0.085, now, 0.06);
    }
    if (!muted && !this.isBgmPlaying) {
      this.startBgmLoop();
    }
    this.listeners.forEach((cb) => cb(this.isMuted));
  }

  /**
   * Plays a single warm marimba/music-box note for the background melody.
   */
  private playMarimbaNote(
    freq: number,
    durationSec: number,
    volume = 0.35,
    isBass = false
  ): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.bgmGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const noteGain = ctx.createGain();

    osc.type = isBass ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    // Subtle warm harmonic
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(isBass ? freq * 0.5 : freq * 2, now);

    const subGain = ctx.createGain();
    subGain.gain.value = isBass ? 0.25 : 0.08;

    // Gentle rounded attack (22ms) so there is zero sharp click
    noteGain.gain.setValueAtTime(0.0001, now);
    noteGain.gain.linearRampToValueAtTime(volume, now + 0.022);
    noteGain.gain.exponentialRampToValueAtTime(0.0008, now + durationSec);

    osc.connect(noteGain);
    subOsc.connect(subGain);
    subGain.connect(noteGain);
    noteGain.connect(this.bgmGain);

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + durationSec + 0.02);
    subOsc.stop(now + durationSec + 0.02);
  }

  /**
   * Starts a cozy, cheerful pastel music-box / marimba pentatonic BGM loop.
   */
  public startBgmLoop(): void {
    if (typeof window === 'undefined') return;
    if (this.bgmTimer !== null) return;
    this.isBgmPlaying = true;

    // Cozy C-Major / F-Major pentatonic melody (notes in Hz)
    // C4=261.6, D4=293.7, E4=329.6, G4=392.0, A4=440.0, C5=523.3, D5=587.3, E5=659.3, G5=784.0
    const melodyPattern: (number | null)[] = [
      523.25, 659.25, 587.33, 523.25,
      440.0, 523.25, 392.0, null,
      440.0, 523.25, 587.33, 659.25,
      587.33, 523.25, 440.0, null,
      523.25, 659.25, 783.99, 659.25,
      587.33, 523.25, 440.0, 392.0,
      349.23, 440.0, 523.25, 440.0,
      392.0, 329.63, 261.63, null,
    ];

    const bassPattern: (number | null)[] = [
      261.63, null, 196.0, null,
      220.0, null, 196.0, null,
      174.61, null, 220.0, null,
      196.0, null, 246.94, null,
      261.63, null, 196.0, null,
      220.0, null, 196.0, null,
      174.61, null, 196.0, null,
      261.63, null, null, null,
    ];

    const stepIntervalMs = 260; // Relaxed, playful ~115 BPM eighth-note feel

    this.bgmTimer = window.setInterval(() => {
      if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
      const idx = this.bgmStep % melodyPattern.length;
      const melFreq = melodyPattern[idx];
      const bassFreq = bassPattern[idx];

      if (melFreq) {
        this.playMarimbaNote(melFreq, 0.42, 0.34, false);
      }
      if (bassFreq) {
        this.playMarimbaNote(bassFreq, 0.65, 0.28, true);
      }
      this.bgmStep++;
    }, stepIntervalMs);
  }

  /**
   * Cute soft UI button tap ("tock").
   */
  public playUiTap(): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(560, now + 0.055);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  /**
   * Soft, bubbly upward hop/jump sound ("boing-bloop").
   */
  public playJump(): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(250, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.15);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.38, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  /**
   * Soft wooden club swing ("whoosh-tock").
   */
  public playClubSwing(): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(115, now + 0.14);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.36, now + 0.016);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  /**
   * Playful cartoon wooden club bonk/slap hit ("bap-bonk!").
   */
  public playSlapHit(): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    // Two-tone warm woodblock bonk
    const freqs: [number, number, number][] = [
      [310, 460, 0],
      [480, 340, 0.055],
    ];
    for (const [f0, f1, delay] of freqs) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f0, now + delay);
      osc.frequency.exponentialRampToValueAtTime(f1, now + delay + 0.11);

      gain.gain.setValueAtTime(0.001, now + delay);
      gain.gain.linearRampToValueAtTime(0.45, now + delay + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.13);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + delay);
      osc.stop(now + delay + 0.14);
    }
  }

  /**
   * Cheerful pastel chime when picking up a Mystery Item Box.
   */
  public playItemPickup(): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const t = now + i * 0.055;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.28, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.24);
    });
  }

  /**
   * Cute item throw / trap drop sound ("ploink").
   */
  public playItemUse(): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(330, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.09);
    osc.frequency.exponentialRampToValueAtTime(390, now + 0.18);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.32, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Warm harmonic swell when activating Active Skill [Q].
   */
  public playSkillActivate(): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const chord = [392.0, 493.88, 587.33, 783.99];
    chord.forEach((freq, idx) => {
      const t = now + idx * 0.04;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.06, t + 0.26);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  /**
   * Soft countdown marimba beep (3, 2, 1, GO!).
   */
  public playCountdownBeep(isGo = false): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const freqs = isGo ? [523.25, 659.25, 783.99] : [440.0];
    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(isGo ? 0.28 : 0.3, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        now + (isGo ? 0.38 : 0.18)
      );

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + (isGo ? 0.4 : 0.2));
    });
  }

  /**
   * Cozy celebratory music-box fanfare when finishing the race!
   */
  public playFinishFanfare(): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const t = now + i * 0.095;
      const dur = i === notes.length - 1 ? 0.55 : 0.22;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.32, t + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    });
  }
}

export const cuteAudio = new CuteAudioEngine();
