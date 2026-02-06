"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, Play, Square, Volume2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { AUDIO_URLS } from "../../hooks/useAdhan";

const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const SOUND_OPTIONS = Object.keys(AUDIO_URLS);

export default function SoundSelectionClient() {
    const router = useRouter();
    const [preferences, setPreferences] = useState<Record<string, string>>({});
    const [volume, setVolume] = useState(1.0);
    const [playingSound, setPlayingSound] = useState<string | null>(null);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

    // Load preferences on mount
    useEffect(() => {
        const savedPrefs = localStorage.getItem("prayerSoundPreferences");
        if (savedPrefs) {
            setPreferences(JSON.parse(savedPrefs));
        } else {
            const defaults: Record<string, string> = {};
            PRAYERS.forEach(p => defaults[p] = "Makkah");
            setPreferences(defaults);
        }

        const savedVol = localStorage.getItem("adhanVolume");
        if (savedVol) {
            setVolume(parseFloat(savedVol));
        }
    }, []);

    const handleSoundChange = (prayer: string, sound: string) => {
        const newPrefs = { ...preferences, [prayer]: sound };
        setPreferences(newPrefs);
        localStorage.setItem("prayerSoundPreferences", JSON.stringify(newPrefs));
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVol = parseFloat(e.target.value);
        setVolume(newVol);
        localStorage.setItem("adhanVolume", newVol.toString());
        // Update current audio volume if playing
        if (audio) audio.volume = newVol;
        // Note: TTS volume cannot be updated while speaking easily without restarting, but next speak will use it.
    };

    const previewSound = (sound: string, prayerName: string) => {
        if (playingSound === sound) {
            // Stop
            audio?.pause();
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            setPlayingSound(null);
            setAudio(null);
        } else {
            // Stop previous if any
            if (audio) {
                audio.pause();
            }
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();

            // Play new
            if (sound === "Voice") {
                setPlayingSound(sound);
                const text = "It is time for prayer now";
                const utterance = new SpeechSynthesisUtterance(text);

                const voices = window.speechSynthesis.getVoices();
                const maleVoice = voices.find(v =>
                    (v.name.includes("Google UK English Male") || v.name.includes("Microsoft David") || v.name.includes("Daniel"))
                ) || voices.find(v => v.name.toLowerCase().includes("male"));

                if (maleVoice) utterance.voice = maleVoice;

                utterance.pitch = 0.4; // Very deep (Old Man)
                utterance.rate = 0.7; // Slow, authoritative
                utterance.volume = volume;

                utterance.onend = () => {
                    setPlayingSound(null);
                };
                window.speechSynthesis.speak(utterance);
            } else {
                const url = AUDIO_URLS[sound as keyof typeof AUDIO_URLS];
                if (url) {
                    const newAudio = new Audio(url);
                    newAudio.volume = volume;
                    newAudio.play();
                    setAudio(newAudio);
                    setPlayingSound(sound);
                    newAudio.onended = () => {
                        setPlayingSound(null);
                        setAudio(null);
                    };
                }
            }
        }
    };

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audio) audio.pause();
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        };
    }, [audio]);

    return (
        <div className="flex flex-col h-full bg-[#050505] relative text-white">
            {/* Header */}
            <div className="flex items-center px-4 py-4 border-b border-[#1a3525] bg-[#0d1b13]">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-full hover:bg-[#13ec6d]/10 text-[#13ec6d] mr-4"
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-[#13ec6d] text-xl font-black uppercase tracking-widest">Sound Settings</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                <p className="text-gray-400 text-sm mb-4">Customize the Adhan sound & volume.</p>

                {PRAYERS.map((prayer) => (
                    <div key={prayer} className="bg-[#0d1b13] border border-[#1a3525] rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#1a3525] flex items-center justify-center text-[#13ec6d] font-bold">
                                {prayer[0]}
                            </div>
                            <span className="text-lg font-bold">{prayer}</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <select
                                value={preferences[prayer] || "Makkah"}
                                onChange={(e) => handleSoundChange(prayer, e.target.value)}
                                className="bg-black/50 text-white border border-[#1a3525] rounded-lg px-3 py-2 text-sm focus:border-[#13ec6d] outline-none"
                            >
                                {SOUND_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>

                            <button
                                onClick={() => previewSound(preferences[prayer] || "Makkah", prayer)}
                                className={`p-2 rounded-full border ${playingSound === (preferences[prayer] || "Makkah") ? "bg-[#13ec6d] text-black border-[#13ec6d]" : "bg-transparent text-[#13ec6d] border-[#13ec6d]"}`}
                            >
                                {playingSound === (preferences[prayer] || "Makkah") ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Volume Bar Bottom Sheet */}
            <div className="absolute bottom-0 left-0 w-full bg-[#0d1b13] border-t border-[#1a3525] p-5 shadow-2xl">
                <div className="flex items-center gap-4">
                    <Volume2 className="text-[#13ec6d]" size={24} />
                    <div className="flex-1">
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="w-full h-2 bg-[#1a3525] rounded-lg appearance-none cursor-pointer accent-[#13ec6d]"
                        />
                    </div>
                    <span className="text-[#13ec6d] font-mono font-bold w-10 text-right">{Math.round(volume * 100)}%</span>
                </div>
            </div>
        </div>
    );
}
