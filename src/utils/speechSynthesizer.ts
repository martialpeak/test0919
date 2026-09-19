import { VoiceSpeaker } from '../types';
import { enrichPersianSpeechText } from './persianVoiceDictionary';
import { apiFetch } from '../services/apiFetch';

export type VoiceTone = 'standard' | 'cinematic' | 'dramatic';

export interface SpeechState {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  activeSpeaker: VoiceSpeaker;
  speechRate: number;
  voiceTone: VoiceTone;
  currentUtteranceText: string;
  wordProgress: number; // 0-100
}

export function cleanAndPreparePersianSpeechText(rawText: string): string {
  return enrichPersianSpeechText(rawText);
}

class PersianVoiceEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private listeners: Set<(state: SpeechState) => void> = new Set();
  private keepAliveInterval: any = null;
  
  private state: SpeechState = {
    isPlaying: false,
    isPaused: false,
    isLoading: false,
    activeSpeaker: 'delara',
    speechRate: 1.0,
    voiceTone: 'cinematic',
    currentUtteranceText: '',
    wordProgress: 0
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioElement = new Audio();
      this.setupAudioElement();

      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
        this.initVoices();
        
        if (this.synth.onvoiceschanged !== undefined) {
          this.synth.onvoiceschanged = () => {
            this.initVoices();
          };
        }
      }
    }
  }

  private setupAudioElement() {
    if (!this.audioElement) return;

    this.audioElement.onplay = () => {
      this.state.isPlaying = true;
      this.state.isPaused = false;
      this.state.isLoading = false;
      this.notify();
    };

    this.audioElement.onpause = () => {
      if (this.state.isPlaying && !this.audioElement?.ended) {
        this.state.isPaused = true;
        this.notify();
      }
    };

    this.audioElement.ontimeupdate = () => {
      if (this.audioElement && this.audioElement.duration > 0) {
        const progress = Math.min(100, Math.round((this.audioElement.currentTime / this.audioElement.duration) * 100));
        this.state.wordProgress = progress;
        this.notify();
      }
    };

    this.audioElement.onended = () => {
      this.state.isPlaying = false;
      this.state.isPaused = false;
      this.state.isLoading = false;
      this.state.wordProgress = 100;
      this.notify();
    };

    this.audioElement.onerror = (e) => {
      console.warn('Audio streaming fallback to Web Speech:', e);
      this.state.isLoading = false;
      if (this.state.currentUtteranceText) {
        this.speakWithBrowserSynth(this.state.currentUtteranceText, this.state.activeSpeaker, this.state.speechRate);
      } else {
        this.state.isPlaying = false;
        this.state.isPaused = false;
        this.notify();
      }
    };
  }

  private initVoices() {
    if (!this.synth) return;
    try {
      this.voices = this.synth.getVoices() || [];
    } catch {
      this.voices = [];
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  // Play a soft acoustic chime to confirm sound output and unlock device speakers
  private playIntroChime(speaker: VoiceSpeaker) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const baseFreq = speaker === 'delara' ? 523.25 : 329.63; // C5 vs E4
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch {
      // ignore
    }
  }

  public subscribe(callback: (state: SpeechState) => void): () => void {
    this.listeners.add(callback);
    callback(this.state);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    const clone = { ...this.state };
    this.listeners.forEach(cb => cb(clone));
  }

  public setSpeaker(speaker: VoiceSpeaker) {
    this.state.activeSpeaker = speaker;
    this.notify();
    if (this.state.isPlaying && !this.state.isPaused && this.state.currentUtteranceText) {
      const current = this.state.currentUtteranceText;
      this.stop();
      this.speak(current, speaker, this.state.speechRate, this.state.voiceTone);
    }
  }

  public setTone(tone: VoiceTone) {
    this.state.voiceTone = tone;
    this.notify();
    if (this.state.isPlaying && !this.state.isPaused && this.state.currentUtteranceText) {
      const current = this.state.currentUtteranceText;
      this.stop();
      this.speak(current, this.state.activeSpeaker, this.state.speechRate, tone);
    }
  }

  public setRate(rate: number) {
    this.state.speechRate = Math.max(0.7, Math.min(1.6, rate));
    if (this.audioElement) {
      this.audioElement.playbackRate = this.state.speechRate;
    }
    this.notify();
    if (this.state.isPlaying && !this.state.isPaused && this.state.currentUtteranceText) {
      const current = this.state.currentUtteranceText;
      this.stop();
      this.speak(current, this.state.activeSpeaker, this.state.speechRate, this.state.voiceTone);
    }
  }

  public speak(text: string, speaker?: VoiceSpeaker, rate?: number, tone?: VoiceTone): void {
    this.stop();

    const preparedText = cleanAndPreparePersianSpeechText(text);
    if (!preparedText) return;

    const chosenSpeaker = speaker || this.state.activeSpeaker;
    const chosenRate = rate || this.state.speechRate;
    const chosenTone = tone || this.state.voiceTone;

    this.playIntroChime(chosenSpeaker);

    this.state.activeSpeaker = chosenSpeaker;
    this.state.speechRate = chosenRate;
    this.state.voiceTone = chosenTone;
    this.state.currentUtteranceText = preparedText;
    this.state.isPlaying = true;
    this.state.isPaused = false;
    this.state.isLoading = true;
    this.state.wordProgress = 0;
    this.notify();

    // Primary: High-fidelity Neural Persian Voice Audio Stream (Delara / Farid)
    if (typeof window !== 'undefined' && this.audioElement) {
      const isLongText = preparedText.length > 500;

      if (!isLongText) {
        const audioUrl = `/api/tts?text=${encodeURIComponent(preparedText)}&speaker=${chosenSpeaker}&rate=${chosenRate}&tone=${chosenTone}`;
        this.audioElement.src = audioUrl;
        this.audioElement.playbackRate = 1.0;

        this.audioElement.play().catch((err) => {
          console.warn('Audio element play error, falling back to POST or browser synth:', err);
          this.speakWithPost(preparedText, chosenSpeaker, chosenRate, chosenTone);
        });
      } else {
        this.speakWithPost(preparedText, chosenSpeaker, chosenRate, chosenTone);
      }
    } else {
      this.speakWithBrowserSynth(preparedText, chosenSpeaker, chosenRate);
    }
  }

  private async speakWithPost(preparedText: string, chosenSpeaker: VoiceSpeaker, chosenRate: number, chosenTone: VoiceTone = 'cinematic') {
    if (!this.audioElement) {
      this.speakWithBrowserSynth(preparedText, chosenSpeaker, chosenRate);
      return;
    }

    try {
      const res = await apiFetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: preparedText,
          speaker: chosenSpeaker,
          rate: chosenRate,
          tone: chosenTone
        })
      });

      if (!res.ok) throw new Error(`TTS server response ${res.status}`);

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      this.audioElement.src = blobUrl;
      this.audioElement.playbackRate = 1.0;
      await this.audioElement.play();
    } catch (err) {
      console.warn('POST TTS playback failed, invoking browser speech synth:', err);
      this.speakWithBrowserSynth(preparedText, chosenSpeaker, chosenRate);
    }
  }

  private speakWithBrowserSynth(preparedText: string, chosenSpeaker: VoiceSpeaker, chosenRate: number) {
    if (!this.synth || typeof window === 'undefined') {
      this.state.isPlaying = false;
      this.notify();
      return;
    }

    if (!this.voices || this.voices.length === 0) {
      this.initVoices();
    }

    const availableVoices = this.voices.length > 0 ? this.voices : (this.synth.getVoices?.() || []);
    
    const matchedVoice = availableVoices.find(v => 
      v.lang.toLowerCase().startsWith('fa') || 
      v.lang.toLowerCase().includes('ir') || 
      v.name.toLowerCase().includes('persian') || 
      v.name.toLowerCase().includes('farsi')
    ) || availableVoices.find(v => 
      v.lang.toLowerCase().startsWith('ar')
    ) || availableVoices.find(v => 
      v.default
    ) || availableVoices[0] || null;

    try {
      const utterance = new SpeechSynthesisUtterance(preparedText);
      
      if (matchedVoice) {
        utterance.voice = matchedVoice;
        utterance.lang = matchedVoice.lang;
      } else {
        utterance.lang = navigator.language || 'en-US';
      }

      if (chosenSpeaker === 'delara') {
        utterance.pitch = 1.15;
        utterance.rate = chosenRate * 0.95;
        utterance.volume = 1.0;
      } else {
        utterance.pitch = 0.82;
        utterance.rate = chosenRate * 0.92;
        utterance.volume = 1.0;
      }

      utterance.onstart = () => {
        this.state.isPlaying = true;
        this.state.isPaused = false;
        this.state.wordProgress = 0;
        this.notify();
        this.startKeepAlive();
      };

      utterance.onend = () => {
        this.clearKeepAlive();
        this.state.isPlaying = false;
        this.state.isPaused = false;
        this.state.wordProgress = 100;
        this.currentUtterance = null;
        this.notify();
      };

      utterance.onerror = (e) => {
        this.clearKeepAlive();
        console.warn('Browser synth utterance error:', e);
        this.state.isPlaying = false;
        this.state.isPaused = false;
        this.currentUtterance = null;
        this.notify();
      };

      utterance.onboundary = (e) => {
        if (preparedText.length > 0 && e.charIndex !== undefined) {
          const progress = Math.min(100, Math.round((e.charIndex / preparedText.length) * 100));
          this.state.wordProgress = progress;
          this.notify();
        }
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    } catch (err) {
      console.warn('Synth speak threw error:', err);
      this.state.isPlaying = false;
      this.notify();
    }
  }

  private startKeepAlive() {
    this.clearKeepAlive();
    this.keepAliveInterval = setInterval(() => {
      if (this.synth && this.synth.speaking && !this.synth.paused) {
        this.synth.pause();
        this.synth.resume();
      }
    }, 8000);
  }

  private clearKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  public pause(): void {
    if (this.audioElement && this.state.isPlaying && !this.state.isPaused) {
      this.audioElement.pause();
    }
    if (this.synth && this.state.isPlaying && !this.state.isPaused) {
      this.synth.pause();
    }
    this.state.isPaused = true;
    this.notify();
  }

  public resume(): void {
    if (this.audioElement && this.state.isPaused) {
      this.audioElement.play().catch(() => {});
    }
    if (this.synth && this.state.isPaused) {
      this.synth.resume();
    }
    this.state.isPaused = false;
    this.notify();
  }

  public togglePlay(text: string, speaker?: VoiceSpeaker): void {
    if (this.state.isPlaying) {
      if (this.state.isPaused) {
        this.resume();
      } else {
        this.pause();
      }
    } else {
      this.speak(text, speaker);
    }
  }

  public stop(): void {
    this.clearKeepAlive();
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {
        // ignore
      }
    }
    this.state.isPlaying = false;
    this.state.isPaused = false;
    this.state.wordProgress = 0;
    this.currentUtterance = null;
    this.notify();
  }

  public getCurrentUtterance(): SpeechSynthesisUtterance | null {
    return this.currentUtterance;
  }

  public getState(): SpeechState {
    return { ...this.state };
  }
}

export const persianVoiceEngine = new PersianVoiceEngine();
