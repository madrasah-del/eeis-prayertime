"use client";
import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface CountdownWidgetProps {
    nextPrayerTime: string; // ISO Date String
    nextPrayerName: string;
}

export default function CountdownWidget({ nextPrayerTime, nextPrayerName }: CountdownWidgetProps) {
    const [timeLeft, setTimeLeft] = useState({ hours: "00", minutes: "00", seconds: "00" });
    const [systemTime, setSystemTime] = useState("");
    const [isFlashing, setIsFlashing] = useState(false);

    const audioRef = React.useRef<HTMLAudioElement | null>(null);
    const lastSecondRef = React.useRef(timeLeft.seconds);

    // Initialize Audio
    useEffect(() => {
        audioRef.current = new Audio("/clock.wav");
    }, []);

    // Effect to play sound OR flash on second change (Only last 4 seconds: 04, 03, 02, 01)
    useEffect(() => {
        if (timeLeft.seconds !== lastSecondRef.current) {
            lastSecondRef.current = timeLeft.seconds;

            const isLastFourSeconds =
                timeLeft.hours === "00" &&
                timeLeft.minutes === "00" &&
                parseInt(timeLeft.seconds) <= 4 &&
                parseInt(timeLeft.seconds) > 0;

            if (isLastFourSeconds) {
                // Check preferences
                const savedPrefs = localStorage.getItem("prayerSoundPreferences");
                let selectedSound = "Makkah"; // Default

                if (savedPrefs) {
                    const prefs = JSON.parse(savedPrefs);
                    if (prefs[nextPrayerName]) {
                        selectedSound = prefs[nextPrayerName];
                    }
                }

                if (selectedSound === "Clock Sound" && audioRef.current) {
                    audioRef.current.currentTime = 0;
                    audioRef.current.play().catch((err) => console.log("Audio play blocked/failed:", err));
                } else if (selectedSound === "Silent") {
                    // Trigger Flash
                    setIsFlashing(true);
                    setTimeout(() => setIsFlashing(false), 200); // Short flash
                }
            }
        }
    }, [timeLeft.hours, timeLeft.minutes, timeLeft.seconds, nextPrayerName]);

    // Effect for Countdown
    useEffect(() => {
        const updateCountdown = () => {
            if (!nextPrayerTime) return;

            const target = new Date(nextPrayerTime);
            const now = new Date();
            const diff = target.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft({ hours: "00", minutes: "00", seconds: "00" });
                return;
            }

            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            setTimeLeft((prev) => {
                // Only update if changed to avoid unnecessary re-renders
                // Actually, existing logic spreads new object every time
                return {
                    hours: hours.toString().padStart(2, '0'),
                    minutes: minutes.toString().padStart(2, '0'),
                    seconds: seconds.toString().padStart(2, '0')
                };
            });
        };

        const timer = setInterval(updateCountdown, 1000);
        updateCountdown();
        return () => clearInterval(timer);
    }, [nextPrayerTime]);

    // Effect for System Clock
    useEffect(() => {
        const updateSystemTime = () => {
            const now = new Date();
            // Format HH:MM:SS
            setSystemTime(now.toLocaleTimeString('en-GB', { hour12: false }));
        };
        const timer = setInterval(updateSystemTime, 1000);
        updateSystemTime();
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="w-full py-1 relative">
            {/* Flash Overlay */}
            {isFlashing && (
                <div className="fixed inset-0 bg-white z-[9999] pointer-events-none animate-pulse"></div>
            )}
            <div className="bg-[#1a3525] rounded-xl py-0.5 px-3 border border-[#13ec6d]/20 flex justify-between items-center relative overflow-hidden min-h-[55px]">
                {/* Background glow effect */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-[#13ec6d]/5 blur-xl rounded-full translate-x-1/2 -translate-y-1/2"></div>

                {/* LEFT: Next Prayer Info & Countdown */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-1">
                            <p className="text-[#13ec6d] text-[10px] font-black uppercase tracking-widest mb-0">Next:</p>
                            <h2 className="text-white text-lg font-black italic tracking-tight">{nextPrayerName}</h2>
                        </div>
                        {/* Countdown row */}
                        <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[#13ec6d] font-mono text-3xl leading-none font-bold">
                                {timeLeft.hours}
                                <span className="text-[8px] text-[#888] ml-[1px]">h</span>
                            </span>
                            <span className="text-[#555] font-black text-xs">:</span>
                            <span className="text-[#13ec6d] font-mono text-3xl leading-none font-bold">
                                {timeLeft.minutes}
                                <span className="text-[8px] text-[#888] ml-[1px]">m</span>
                            </span>
                            <span className="text-[#555] font-black text-xs">:</span>
                            <span className="text-[#13ec6d] font-mono text-3xl leading-none font-bold">
                                {timeLeft.seconds}
                                <span className="text-[8px] text-[#888] ml-[1px]">s</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* RIGHT: System Clock with Icon and Label */}
                <div className="flex flex-col items-end justify-center relative z-10">
                    <div className="flex items-center gap-2 bg-black/30 px-2 py-1 rounded-lg border border-white/5 mb-0.5">
                        {/* Clock Icon Removed for cleanup */}
                        <span className="text-white text-lg font-black tracking-widest font-mono shadow-lg text-shadow-glow leading-none">
                            {systemTime || "--:--:--"}
                        </span>
                    </div>
                    {/* Label Green */}
                    <p className="text-[#13ec6d] text-[8px] font-black uppercase tracking-[0.2em] mr-1">Current Time</p>
                </div>
            </div>
        </div>
    );
}
