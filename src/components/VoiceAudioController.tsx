import React from 'react';
import { VoiceSpeaker } from '../types';
import { persianVoiceEngine, SpeechState, VoiceTone } from '../utils/speechSynthesizer';
import { Play, Pause, RotateCcw, Volume2, Sparkles, User, UserCheck, Loader2 } from 'lucide-react';

interface VoiceAudioControllerProps {
  textToRead?: string;
  defaultSpeaker?: VoiceSpeaker;
  compact?: boolean;
  className?: string;
  onSpeakerChange?: (speaker: VoiceSpeaker) => void;
}

export const VoiceAudioController: React.FC<VoiceAudioControllerProps> = ({
  textToRead,
  defaultSpeaker,
  compact = false,
  className = '',
  onSpeakerChange
}) => {
  const [speechState, setSpeechState] = React.useState<SpeechState>(persianVoiceEngine.getState());

  React.useEffect(() => {
    if (defaultSpeaker && defaultSpeaker !== speechState.activeSpeaker) {
      persianVoiceEngine.setSpeaker(defaultSpeaker);
    }
  }, [defaultSpeaker]);

  React.useEffect(() => {
    const unsubscribe = persianVoiceEngine.subscribe((state) => {
      setSpeechState(state);
    });
    return () => unsubscribe();
  }, []);

  const handleTogglePlay = () => {
    if (textToRead) {
      persianVoiceEngine.togglePlay(textToRead, speechState.activeSpeaker);
    } else if (speechState.isPlaying) {
      if (speechState.isPaused) {
        persianVoiceEngine.resume();
      } else {
        persianVoiceEngine.pause();
      }
    }
  };

  const handleSpeakerSwitch = (speaker: VoiceSpeaker) => {
    persianVoiceEngine.setSpeaker(speaker);
    if (onSpeakerChange) {
      onSpeakerChange(speaker);
    }
  };

  const handleToneSwitch = (tone: VoiceTone) => {
    persianVoiceEngine.setTone(tone);
  };

  const handleRateCycle = () => {
    const rates = [0.85, 1.0, 1.15, 1.3];
    const currentIdx = rates.indexOf(speechState.speechRate);
    const nextRate = rates[(currentIdx + 1) % rates.length] || 1.0;
    persianVoiceEngine.setRate(nextRate);
  };

  const handleStop = () => {
    persianVoiceEngine.stop();
  };

  const isCurrentTextPlaying = speechState.isPlaying && (!textToRead || speechState.currentUtteranceText.includes(textToRead.slice(0, 30)));

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 bg-[#1C1C2E]/90 border border-[#2A2A40] rounded-xl px-2.5 py-1 text-xs select-none backdrop-blur-sm ${className}`}>
        <button
          onClick={handleTogglePlay}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg font-medium transition-all ${
            isCurrentTextPlaying && !speechState.isPaused
              ? 'bg-[#E50914] text-white animate-pulse'
              : 'bg-[#2A2A40] text-gray-200 hover:bg-[#3B3B54] hover:text-white'
          }`}
          title="خوانش صوتی هوشمند فارسی"
        >
          {speechState.isLoading && isCurrentTextPlaying ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isCurrentTextPlaying && !speechState.isPaused ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>
            {speechState.isLoading && isCurrentTextPlaying 
              ? 'بارگذاری...' 
              : isCurrentTextPlaying && !speechState.isPaused 
                ? 'در حال خوانش...' 
                : 'شنیدن با صدا'}
          </span>
        </button>

        {/* Voice Selector Mini */}
        <div className="flex items-center bg-[#141420] rounded-lg p-0.5 border border-[#2A2A40]">
          <button
            onClick={() => handleSpeakerSwitch('delara')}
            className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
              speechState.activeSpeaker === 'delara'
                ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            دل‌آرا
          </button>
          <button
            onClick={() => handleSpeakerSwitch('farid')}
            className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
              speechState.activeSpeaker === 'farid'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            فرید
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-[#1A1A2E] via-[#161626] to-[#1F1B2E] border border-[#34344E] rounded-2xl p-4 shadow-xl shadow-black/40 backdrop-blur-md ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Voice Badge & Visualizer */}
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-all ${
            speechState.activeSpeaker === 'delara' 
              ? 'bg-gradient-to-br from-rose-500 to-pink-600 shadow-rose-500/20 text-white'
              : 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20 text-white'
          }`}>
            <Volume2 className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white">
                سیستم خوانش سینمایی
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 font-medium">
                <Sparkles className="w-2.5 h-2.5" />
                دیتابیس آوایی و اکسان‌گذاری پیشرفته
              </span>
            </div>
            <p className="text-xs text-[#A0A0B5] mt-0.5">
              گوینده فعال: <span className="text-white font-bold">{speechState.activeSpeaker === 'delara' ? 'دل‌آرا (لحن صمیمی و منتقد ادیب)' : 'فرید (لحن بم و کاریزماتیک رادیو)'}</span>
            </p>
          </div>
        </div>

        {/* Live Audio Waveform / Loading Simulation */}
        {speechState.isPlaying && !speechState.isPaused && (
          <div className="flex items-center gap-1 px-3 py-1.5 bg-[#141420]/80 rounded-xl border border-[#2A2A40]">
            {speechState.isLoading ? (
              <div className="flex items-center gap-2 text-xs text-rose-300">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                <span>در حال آماده‌سازی صوت...</span>
              </div>
            ) : (
              <>
                <div className="w-1 h-3 bg-red-500 rounded-full animate-pulse" />
                <div className="w-1 h-6 bg-rose-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite]" />
                <div className="w-1 h-4 bg-amber-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite]" />
                <div className="w-1 h-7 bg-red-500 rounded-full animate-[pulse_0.5s_ease-in-out_infinite]" />
                <div className="w-1 h-3 bg-rose-400 rounded-full animate-pulse" />
                <span className="text-[11px] text-[#A0A0B5] mr-1.5 font-mono">
                  {speechState.wordProgress}%
                </span>
              </>
            )}
          </div>
        )}

        {/* Interactive Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Speaker Switch Tabs */}
          <div className="flex bg-[#141420] p-1 rounded-xl border border-[#2A2A40]">
            <button
              onClick={() => handleSpeakerSwitch('delara')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                speechState.activeSpeaker === 'delara'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/20'
                  : 'text-[#8E8EA8] hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              صدای دل‌آرا
            </button>
            <button
              onClick={() => handleSpeakerSwitch('farid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                speechState.activeSpeaker === 'farid'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20'
                  : 'text-[#8E8EA8] hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              صدای فرید
            </button>
          </div>

          {/* Tone Selector */}
          <div className="flex bg-[#141420] p-1 rounded-xl border border-[#2A2A40]">
            <button
              onClick={() => handleToneSwitch('cinematic')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                speechState.voiceTone === 'cinematic'
                  ? 'bg-[#2A2A40] text-emerald-300 font-bold border border-emerald-500/30'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="لحن سینمایی و تحلیلی"
            >
              سینمایی
            </button>
            <button
              onClick={() => handleToneSwitch('dramatic')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                speechState.voiceTone === 'dramatic'
                  ? 'bg-[#2A2A40] text-amber-300 font-bold border border-amber-500/30'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="لحن حماسی و تیزر سینمایی"
            >
              حماسی
            </button>
          </div>

          {/* Speed Button */}
          <button
            onClick={handleRateCycle}
            className="px-2.5 py-1.5 bg-[#1C1C2E] hover:bg-[#2A2A40] text-[#A0A0B5] hover:text-white rounded-xl text-xs font-mono border border-[#2A2A40] transition-colors"
            title="سرعت خوانش"
          >
            {speechState.speechRate}x
          </button>

          {/* Play / Pause Main Button */}
          <button
            onClick={handleTogglePlay}
            disabled={speechState.isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
              speechState.isLoading
                ? 'bg-gray-600 text-gray-300 cursor-wait'
                : speechState.isPlaying && !speechState.isPaused
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/25'
                  : 'bg-[#E50914] hover:bg-red-700 text-white shadow-red-600/25'
            }`}
          >
            {speechState.isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>در حال آماده‌سازی...</span>
              </>
            ) : speechState.isPlaying && !speechState.isPaused ? (
              <>
                <Pause className="w-4 h-4" />
                <span>توقف موقت</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{speechState.isPaused ? 'ادامه خوانش' : 'پخش صوتی کامل'}</span>
              </>
            )}
          </button>

          {/* Stop / Replay */}
          {speechState.isPlaying && (
            <button
              onClick={handleStop}
              className="p-2 bg-[#1C1C2E] hover:bg-red-500/20 text-[#A0A0B5] hover:text-red-400 rounded-xl border border-[#2A2A40] transition-colors"
              title="توقف کامل"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar when reading */}
      {speechState.isPlaying && (
        <div className="w-full bg-[#141420] h-1.5 rounded-full overflow-hidden mt-3 border border-[#2A2A40]">
          <div 
            className="bg-gradient-to-r from-red-500 via-rose-400 to-amber-400 h-full transition-all duration-300 rounded-full"
            style={{ width: `${Math.max(5, speechState.wordProgress)}%` }}
          />
        </div>
      )}
    </div>
  );
};
