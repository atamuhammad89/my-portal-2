"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Search, Play, Pause, Check, Volume2, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RetellVoice } from "@/types/retell";
import { RETELL_VOICE_CATALOG } from "@/lib/retell-voices-catalog";

interface RetellVoiceLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoiceId: string;
  onSelectVoice: (voice: RetellVoice) => void;
}

function VoiceAvatar({
  name,
  gender,
  avatarUrl,
  size = "md",
}: {
  name: string;
  gender?: string;
  avatarUrl?: string;
  size?: "sm" | "md" | "lg";
}) {
  const [imgError, setImgError] = useState(false);
  const initials = (name || "V").slice(0, 2).toUpperCase();
  const isFemale = gender?.toLowerCase() === "female";
  const gradientClass = isFemale
    ? "from-pink-500/30 to-purple-600/40 text-pink-200 border-pink-500/40"
    : "from-blue-500/30 to-indigo-600/40 text-blue-200 border-blue-500/40";
  const sizeClasses =
    size === "sm"
      ? "h-9 w-9 text-[11px]"
      : size === "lg"
      ? "h-14 w-14 text-base"
      : "h-11 w-11 text-xs";

  if (avatarUrl && !imgError) {
    return (
      <div className="relative shrink-0">
        <img
          src={avatarUrl}
          alt={name}
          onError={() => setImgError(true)}
          className={cn(
            "rounded-full object-cover border-2 border-[#2e3040]",
            sizeClasses
          )}
        />
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#141518]" />
      </div>
    );
  }

  return (
    <div className="relative shrink-0">
      <div
        className={cn(
          "rounded-full bg-gradient-to-br border flex items-center justify-center font-bold tracking-wider",
          gradientClass,
          sizeClasses
        )}
      >
        {initials}
      </div>
      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#141518]" />
    </div>
  );
}

export function RetellVoiceLibraryModal({
  isOpen,
  onClose,
  selectedVoiceId,
  onSelectVoice,
}: RetellVoiceLibraryModalProps) {
  const [voices, setVoices] = useState<RetellVoice[]>(
    RETELL_VOICE_CATALOG.filter((v) => v.provider === "retell")
  );
  const [loading, setLoading] = useState(false);
  const [genderFilter, setGenderFilter] = useState("all");
  const [accentFilter, setAccentFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchVoices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/retell/voices");
      if (res.ok) {
        const data: RetellVoice[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Show all voices returned by Retell API — all are valid platform voices
          setVoices(data);
        }
      }
    } catch (e) {
      console.warn("[Fetch Voices]", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchVoices();
  }, [isOpen]);

  const stopAllAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }
    }
    setPlayingVoiceId(null);
  };

  useEffect(() => () => stopAllAudio(), []);

  const playSpeechTTS = (voice: RetellVoice) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setPlayingVoiceId(null);
      return;
    }

    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const introText = voice.trait
      ? `Hi, I'm ${voice.voice_name}. I'm an AI voice model tuned for ${voice.trait}.`
      : `Hi, I'm ${voice.voice_name}. I'm an AI agent voice with a ${voice.accent || "natural"} accent.`;

    const utterance = new SpeechSynthesisUtterance(introText);

    let hash = 0;
    const str = voice.voice_id || voice.voice_name || "voice";
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const posHash = Math.abs(hash);

    const isFemale = voice.gender?.toLowerCase() === "female";

    const pitchBase = isFemale ? 0.95 : 0.65;
    const pitchVar = (posHash % 60) / 100;
    utterance.pitch = Math.min(2.0, Math.max(0.5, pitchBase + pitchVar));

    const rateBase = 0.88;
    const rateVar = ((posHash >> 2) % 35) / 100;
    utterance.rate = Math.min(1.5, Math.max(0.7, rateBase + rateVar));

    const availVoices = window.speechSynthesis.getVoices();
    if (availVoices.length > 0) {
      const matchingGenderVoices = availVoices.filter((sv) => {
        const name = sv.name.toLowerCase();
        if (isFemale) {
          return (
            name.includes("female") ||
            name.includes("zira") ||
            name.includes("samantha") ||
            name.includes("victoria") ||
            name.includes("karen") ||
            name.includes("fiona") ||
            name.includes("google us english")
          );
        } else {
          return (
            name.includes("male") ||
            name.includes("david") ||
            name.includes("alex") ||
            name.includes("george") ||
            name.includes("daniel") ||
            name.includes("google us english")
          );
        }
      });

      const voicePool = matchingGenderVoices.length > 0 ? matchingGenderVoices : availVoices;
      utterance.voice = voicePool[posHash % voicePool.length];
    }

    utterance.onstart = () => {
      setPlayingVoiceId(voice.voice_id);
    };

    utterance.onend = () => {
      setPlayingVoiceId((curr) => (curr === voice.voice_id ? null : curr));
    };

    utterance.onerror = (e) => {
      if (e.error !== "canceled" && e.error !== "interrupted") {
        setPlayingVoiceId((curr) => (curr === voice.voice_id ? null : curr));
      }
    };

    // Immediately set active playing state to respond visually to user click
    setPlayingVoiceId(voice.voice_id);

    // Micro-delay to prevent Chrome cancel race condition
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 40);
  };

  const handlePlayPreview = (voice: RetellVoice, e: React.MouseEvent) => {
    e.stopPropagation();

    if (playingVoiceId === voice.voice_id) {
      stopAllAudio();
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    setPlayingVoiceId(voice.voice_id);

    const audioUrl = voice.preview_audio_url;

    if (audioUrl && !audioUrl.includes("actions.google.com")) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onplay = () => setPlayingVoiceId(voice.voice_id);
      audio.onended = () => setPlayingVoiceId((curr) => (curr === voice.voice_id ? null : curr));
      audio.onerror = () => playSpeechTTS(voice);

      audio.play().catch(() => {
        playSpeechTTS(voice);
      });
    } else {
      playSpeechTTS(voice);
    }
  };

  if (!isOpen) return null;

  const filtered = voices.filter((v) => {
    if (genderFilter !== "all" && (v.gender || "").toLowerCase() !== genderFilter) return false;
    if (accentFilter !== "all" && (v.accent || "").toLowerCase() !== accentFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !v.voice_name.toLowerCase().includes(q) &&
        !v.voice_id.toLowerCase().includes(q) &&
        !(v.trait || "").toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-[#141518] border border-[#2a2d36] rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2d36] bg-[#18191e] shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-[var(--brand-500)]/10 flex items-center justify-center">
              <Mic className="h-4 w-4 text-[var(--brand-500)]" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">CallAutomate Voice Library</h2>
              <p className="text-[11px] text-slate-400">
                {loading ? "Loading voices…" : `${filtered.length} voices available`}
              </p>
            </div>
          </div>
          <button
            onClick={() => { stopAllAudio(); onClose(); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#2a2d36] transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-3 border-b border-[#2a2d36] bg-[#16171b] flex flex-wrap items-center gap-3 shrink-0">
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="bg-[#1e2028] border border-[#2e3140] rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-[var(--brand-500)] cursor-pointer"
          >
            <option value="all">Gender: All</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>

          <select
            value={accentFilter}
            onChange={(e) => setAccentFilter(e.target.value)}
            className="bg-[#1e2028] border border-[#2e3140] rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-[var(--brand-500)] cursor-pointer"
          >
            <option value="all">Accent: All</option>
            <option value="american">American</option>
            <option value="british">British</option>
            <option value="australian">Australian</option>
            <option value="mexican">Mexican</option>
          </select>

          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search voices…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1e2028] border border-[#2e3140] rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[var(--brand-500)]"
            />
          </div>
        </div>

        {/* Voice Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="h-8 w-8 rounded-full border-2 border-[var(--brand-500)] border-t-transparent animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Fetching available agent voices…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <div className="h-14 w-14 rounded-full bg-[#26282e] flex items-center justify-center">
                <Volume2 className="h-6 w-6 text-slate-500" />
              </div>
              <p className="font-bold text-slate-300 text-sm">No voices found</p>
              <p className="text-xs text-slate-500 max-w-xs">
                Try adjusting your filters or{" "}
                <button onClick={fetchVoices} className="text-[var(--brand-500)] underline cursor-pointer">
                  reload voices
                </button>
                .
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((voice) => {
                const isSelected = selectedVoiceId === voice.voice_id;
                const isPlaying = playingVoiceId === voice.voice_id;

                return (
                  <div
                    key={voice.voice_id}
                    onClick={() => {
                      stopAllAudio();
                      onSelectVoice(voice);
                      onClose();
                    }}
                    className={cn(
                      "group relative p-4 rounded-xl border transition-all cursor-pointer",
                      isSelected
                        ? "bg-[var(--brand-500)]/5 border-[var(--brand-500)] ring-1 ring-[var(--brand-500)]/50 shadow-lg shadow-[var(--brand-500)]/10"
                        : "bg-[#1a1c22] border-[#2a2d36] hover:border-[#3a3d4a] hover:bg-[#1e2028]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <VoiceAvatar
                        name={voice.voice_name}
                        gender={voice.gender}
                        avatarUrl={voice.avatar_url}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-xs text-white truncate">
                            {voice.voice_name}
                          </p>
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 text-[var(--brand-500)] shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {voice.trait ||
                            `${voice.accent || "American"} · ${voice.age || "Middle Aged"} · ${voice.gender || "—"}`}
                        </p>
                      </div>

                      <button
                        onClick={(e) => handlePlayPreview(voice, e)}
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center shrink-0 border transition cursor-pointer",
                          isPlaying
                            ? "bg-[var(--brand-500)] border-[var(--brand-500)] text-white shadow-md shadow-[var(--brand-500)]/30"
                            : "bg-[#26282e] border-[#363943] text-slate-300 hover:bg-[#32353e] hover:text-white"
                        )}
                      >
                        {isPlaying ? (
                          <Pause className="h-3.5 w-3.5 fill-current" />
                        ) : (
                          <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                        )}
                      </button>
                    </div>

                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <span className="px-1.5 py-0.5 rounded-md bg-[var(--brand-500)] text-[9px] font-bold text-white uppercase tracking-wide">
                          Active
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#2a2d36] bg-[#16171b] flex items-center justify-between shrink-0">
          <p className="text-[10px] text-slate-500">
            Voices powered by <span className="text-slate-300 font-semibold">CallAutomate</span>
          </p>
          <button
            onClick={() => { stopAllAudio(); onClose(); }}
            className="px-4 py-1.5 text-xs font-bold rounded-xl border border-[#2e3140] text-slate-300 hover:text-white hover:bg-[#26282e] transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
