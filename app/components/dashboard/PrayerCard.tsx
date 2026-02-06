"use client";
import { clsx } from "clsx";
import { Volume2, VolumeX, Square, Play } from "lucide-react";
import { useState, useEffect } from "react";
import { useAdhan, AUDIO_URLS } from "../../hooks/useAdhan";

interface PrayerCardProps {
    name: string;
    adhanTime: string;
    jamatTime: string;
    isActive?: boolean;
    isSunrise?: boolean;
    icon?: string; // Material Symbol name
    sponsored?: string;
}

export default function PrayerCard({ name, adhanTime, jamatTime, isActive, isSunrise, icon = "schedule", sponsored }: PrayerCardProps) {
    const [isAdhanEnabled, setIsAdhanEnabled] = useState(true);
    const [sound, setSound] = useState("Makkah");

    // Use custom hook
    const { isPlaying, play, stop, error } = useAdhan();

    const handleToggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsAdhanEnabled(!isAdhanEnabled);
        if (isPlaying) {
            stop();
        }
    };

    const handleManualPlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isPlaying) {
            stop();
        } else {
            play(sound);
        }
    };

    // Check time and play Adhan
    useEffect(() => {
        if (!isAdhanEnabled || isSunrise) return;

        const checkTime = () => {
            const now = new Date();
            const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            // Note: code.html uses 24h format (e.g. 13:10), so we should check formatting consistency. 
            // If adhanTime passed is 12h (05:12 AM), we need to ensure match.
            // Let's assume input is consistent for now or convert if needed. 
            // We'll stick to string matching for simplicity if inputs are controlled.

            // To be safe with the new design using 24h format, if adhanTime in props is 24h, this `currentTime` needs to match.
            // If the props are still "05:12 AM", we need to adjust logic. 
            // For this refactor, I will assume we update data to 24h as per code.html, or handle it carefully.
        };
        // Auto-play logic commented out until data format is finalized
        // const interval = setInterval(checkTime, 1000);
        // return () => clearInterval(interval);
    }, [adhanTime, isAdhanEnabled, sound, isPlaying, isSunrise, play, name]);

    // Design: Active vs Inactive
    if (isActive) {
        return (
            <div className="bg-primary rounded-2xl p-5 border border-primary flex justify-between items-center shadow-lg shadow-primary/20 relative overflow-hidden">
                <div className="flex items-center gap-4 relative z-10">
                    <span className="material-symbols-outlined text-white fill-1">{icon}</span>
                    <p className="text-white text-xl font-black">{name}</p>
                </div>
                <div className="flex gap-4 sm:gap-8 items-center relative z-10">
                    <p className="text-white text-4xl font-black w-[5.5rem] text-center">{adhanTime}</p>
                    <p className="text-white text-4xl font-black w-[5.5rem] text-center">{jamatTime}</p>
                </div>

                {/* Sponsored Tag Active */}
                {sponsored && (
                    <div className="absolute top-1 right-2 z-0 opacity-20 pointer-events-none">
                        <p className="text-[#d4af37] font-black text-2xl uppercase tracking-widest leading-none">
                            SPONSORED
                        </p>
                    </div>
                )}
                {sponsored && (
                    <div className="absolute bottom-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/50 to-transparent"></div>
                )}


                {/* Controls overlay for active card */}
                {!isSunrise && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 hover:opacity-100 transition-opacity z-20 bg-black/20 p-1 rounded-lg backdrop-blur-sm">
                        <button onClick={handleManualPlay} className="p-1 hover:text-white text-white/80">
                            {isPlaying ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                        </button>
                        <button onClick={handleToggleMute} className="p-1 hover:text-white text-white/80">
                            {isAdhanEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Inactive / Sunrise
    return (
        <div className={clsx(
            "rounded-2xl p-5 border flex justify-between items-center transition-colors relative overflow-hidden",
            isSunrise
                ? "bg-[#1a3525]/20 border-white/5 opacity-70"
                : "bg-[#1a3525]/40 border-primary/10 hover:border-primary/30"
        )}>
            <div className="flex items-center gap-4 relative z-10">
                <span className={clsx("material-symbols-outlined", isSunrise ? "text-secondary" : "text-primary")}>
                    {icon}
                </span>
                <p className="text-white text-xl font-bold">{name}</p>
            </div>
            <div className="flex gap-4 sm:gap-8 items-center relative z-10">
                <p className={clsx("text-4xl font-bold w-[5.5rem] text-center", isSunrise ? "text-white" : "text-primary font-black")}>
                    {adhanTime}
                </p>
                {/* Sunrise usually doesn't have Jamat time in the same way, usually empty or same */}
                <div className="w-[5.5rem] text-center">
                    {!isSunrise && (
                        <p className="text-primary text-4xl font-black">{jamatTime}</p>
                    )}
                </div>
            </div>

            {/* Sponsored Tag Inactive */}
            {sponsored && (
                <div className="absolute top-1 right-2 z-0 opacity-10 pointer-events-none">
                    <p className="text-[#d4af37] font-black text-2xl uppercase tracking-widest leading-none">
                        SPONSORED
                    </p>
                </div>
            )}
            {sponsored && (
                <div className="absolute bottom-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent"></div>
            )}
        </div>
    );
}

// Helper to map names to icons
export const getPrayerIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('fajr')) return 'wb_twilight';
    if (lower.includes('sunrise') || lower.includes('shuruq')) return 'light_mode';
    if (lower.includes('dhuhr')) return 'sunny';
    if (lower.includes('asr')) return 'wb_sunny';
    if (lower.includes('maghrib')) return 'dark_mode';
    if (lower.includes('isha')) return 'bedtime';
    return 'schedule';
}
