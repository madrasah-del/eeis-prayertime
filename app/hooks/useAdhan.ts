import { useState, useEffect, useRef } from 'react';

type AdhanSound = "Makkah" | "Madina" | "Al-Aqsa" | "Voice" | "Clock Sound" | "Silent" | "Notification" | "Birds Song";

export const AUDIO_URLS: Record<AdhanSound, string> = {
    "Makkah": "https://www.islamcan.com/audio/adhan/azan1.mp3",
    "Madina": "https://www.islamcan.com/audio/adhan/azan20.mp3",
    "Al-Aqsa": "https://www.islamcan.com/audio/adhan/azan3.mp3",
    "Voice": "", // Placeholder, handled via Logic
    "Clock Sound": "/clock.wav",
    "Silent": "",
    "Notification": "/notify.mp3",
    "Birds Song": "https://www.orangefreesounds.com/wp-content/uploads/2019/03/Relaxing-bird-sounds.mp3"
};

interface UseAdhanReturn {
    isPlaying: boolean;
    play: (soundName: string, prayerName?: string) => void;
    stop: () => void;
    error: string | null;
}

export function useAdhan(): UseAdhanReturn {
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize audio object only on client side
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio();

            // Cleanup on unmount
            return () => {
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.src = "";
                }
            };
        }
    }, []);

    const play = async (soundName: string, prayerName?: string) => {
        if (!audioRef.current) return;

        // Get Volume
        const savedVol = localStorage.getItem("adhanVolume");
        const volume = savedVol ? parseFloat(savedVol) : 1.0;

        try {
            setError(null);

            // Handle Voice TTS
            if (soundName === "Voice") {
                if ('speechSynthesis' in window) {
                    // Stop any current audio
                    audioRef.current.pause();
                    window.speechSynthesis.cancel();

                    const text = "It's time for prayer now";
                    const utterance = new SpeechSynthesisUtterance(text);

                    // Attempt to find a male voice if possible
                    const voices = window.speechSynthesis.getVoices();
                    const maleVoice = voices.find(v => v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("david") || v.name.toLowerCase().includes("james"));
                    if (maleVoice) utterance.voice = maleVoice;

                    utterance.pitch = 0.6; // Deep voice
                    utterance.rate = 0.85; // Slightly slower
                    utterance.volume = volume;

                    utterance.onstart = () => setIsPlaying(true);
                    utterance.onend = () => setIsPlaying(false);

                    window.speechSynthesis.speak(utterance);
                    return;
                } else {
                    console.warn("TTS not supported");
                    // Fallback to Makkah?
                }
            }

            // Normal Audio
            const src = AUDIO_URLS[soundName as AdhanSound] || AUDIO_URLS["Makkah"];
            if (!src) return;

            audioRef.current.src = src;
            audioRef.current.volume = volume;
            audioRef.current.load();

            const playPromise = audioRef.current.play();

            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        setIsPlaying(true);
                    })
                    .catch((err) => {
                        console.error("Audio playback failed:", err);
                        setError("Playback failed. Interaction needed.");
                        setIsPlaying(false);
                    });
            }

            audioRef.current.onended = () => {
                setIsPlaying(false);
            };

        } catch (err) {
            console.error("Error setting up audio:", err);
            setError("Audio setup error");
        }
    };

    const stop = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
        }
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    };

    return { isPlaying, play, stop, error };
}
