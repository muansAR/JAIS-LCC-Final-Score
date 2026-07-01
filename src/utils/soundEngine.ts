/**
 * Web Audio API Offline Synthesizer
 * Programmatic audio generation for professional LCC scoring sounds
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private volume: number = 0.5;
  private isMuted: boolean = false;

  private init() {
    if (!this.ctx) {
      // @ts-ignore
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMute(muted: boolean) {
    this.isMuted = muted;
    // Keep context awake
    if (!muted) {
      this.init();
    }
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  private createGainNode(duration: number): { gainNode: GainNode; destination: AudioNode } | null {
    if (!this.ctx) return null;
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    gainNode.connect(this.ctx.destination);
    return { gainNode, destination: gainNode };
  }

  playCorrect() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    // Harmonic double ding (E5=659.25Hz, E6=1318.51Hz)
    osc1.frequency.setValueAtTime(659.25, now);
    osc2.frequency.setValueAtTime(1318.51, now);

    gainNode.gain.setValueAtTime(0, now);
    // Double ding sequence
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.5, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    // Second ding after 0.12 seconds
    const now2 = now + 0.12;
    const osc3 = this.ctx.createOscillator();
    const osc4 = this.ctx.createOscillator();
    const gainNode2 = this.ctx.createGain();

    osc3.type = 'sine';
    osc4.type = 'sine';
    osc3.frequency.setValueAtTime(880, now2); // A5
    osc4.frequency.setValueAtTime(1760, now2); // A6

    gainNode2.gain.setValueAtTime(0, now2);
    gainNode2.gain.linearRampToValueAtTime(this.volume * 0.6, now2 + 0.05);
    gainNode2.gain.exponentialRampToValueAtTime(0.001, now2 + 0.6);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc3.connect(gainNode2);
    osc4.connect(gainNode2);
    gainNode2.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);

    osc3.start(now2);
    osc4.start(now2);
    osc3.stop(now2 + 0.7);
    osc4.stop(now2 + 0.7);
  }

  playWrong() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    // Sawtooth for rough buzzt feeling
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(110, now); // Low A2
    osc1.frequency.linearRampToValueAtTime(85, now + 0.45); // Pitch bend down

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(111.5, now); // Detuned

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.6, now + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  }

  playTick(isAlert: boolean = false) {
    this.init();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'sine';
    // Normal seconds are a soft woody click, final 3 seconds are a sharp high beep
    const freq = isAlert ? 1500 : 800;
    const duration = isAlert ? 0.08 : 0.03;

    osc.frequency.setValueAtTime(freq, now);

    gainNode.gain.setValueAtTime(this.volume * (isAlert ? 0.4 : 0.15), now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  playBuzz() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const oscFilter = this.ctx.createBiquadFilter();
    const gainNode = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // Rising laser sound

    oscFilter.type = 'lowpass';
    oscFilter.Q.setValueAtTime(10, now);
    oscFilter.frequency.setValueAtTime(1000, now);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.7, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(oscFilter);
    oscFilter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  playBell() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc2.frequency.setValueAtTime(659.25, now); // E5

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.6, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2); // long ringing bell

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.3);
    osc2.stop(now + 1.3);
  }

  playWinner() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major scale arpeggio
    const chordTime = 0.10;

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = now + idx * chordTime;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gainNode.gain.setValueAtTime(0, t);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.25, t + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.9);
    });
  }
}

export const soundEngine = new SoundEngine();
export default soundEngine;
