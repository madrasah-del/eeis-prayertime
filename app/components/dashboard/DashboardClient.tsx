"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CountdownWidget from "./CountdownWidget";
import ScrollingWidget from "./ScrollingWidget";
import prayerScheduleRaw from "../../data/prayer_schedule.json";
import { JUMMAH_TIMES } from "../../data/constants";

// Define Types
type PrayerTime = { adhan: string; jamat: string };
type DailySchedule = {
    fajr: PrayerTime;
    shuruq: string;
    dhuhr: PrayerTime;
    asr: PrayerTime;
    maghrib: PrayerTime;
    isha: PrayerTime;
    hijri: string;
};
type PrayerSchedule = Record<string, DailySchedule>;

const prayerSchedule = prayerScheduleRaw as PrayerSchedule;

export default function DashboardClient() {
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    // Initialize on mount
    useEffect(() => {
        setCurrentTime(new Date());
        const interval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    if (!currentTime) return null;

    // Format Date for lookup YYYY-MM-DD
    const dateKey = currentTime.toISOString().split("T")[0];
    const todayData = prayerSchedule[dateKey];
    const isFriday = currentTime.getDay() === 5; // 0 = Sun, 5 = Fri

    // Helper to parse time string "HH:MM"
    const parseTime = (timeStr: string, date: Date = currentTime) => {
        if (!timeStr) return null;
        const [h, m] = timeStr.split(":").map(Number);
        const newDate = new Date(date);
        newDate.setHours(h, m, 0, 0);
        return newDate;
    };

    // Base Prayers List
    const prayersList = [
        { key: "fajr", name: "Fajr", icon: "wb_twilight" },
        { key: "shuruq", name: "Shuruq", icon: "light_mode", isSunrise: true },
        { key: "dhuhr", name: "Dhuhr", icon: "sunny" },
        { key: "asr", name: "Asr", icon: "wb_sunny" },
        { key: "maghrib", name: "Maghrib", icon: "wb_twilight" },
        { key: "isha", name: "Isha", icon: "bedtime" },
    ];

    /* 
       FRIDAY LOGIC:
       - Adhan should always be the original Dhuhr Time Adhan.
       - Name & Iqamah switch based on 12:40 cutoff.
    */
    let dhuhrOverrideName = "Dhuhr";
    let dhuhrOverrideIqamah = "";
    let jummahCutoffPassed = false;

    if (isFriday && todayData) {
        // Cutoff time is 12:40 (Jummah 1 Iqamah time)
        const jummah1Time = parseTime(JUMMAH_TIMES[0].time); // 12:40

        if (jummah1Time) {
            if (currentTime < jummah1Time) {
                // Before 12:40
                dhuhrOverrideName = "Jummah 1";
                dhuhrOverrideIqamah = JUMMAH_TIMES[0].time; // 12:40
                jummahCutoffPassed = false;
            } else {
                // After 12:40
                dhuhrOverrideName = "Jummah 2";
                dhuhrOverrideIqamah = JUMMAH_TIMES[1].time; // 13:15
                jummahCutoffPassed = true;
            }
        }
    }

    // --- LOGIC: Active Prayer & Next Prayer ---

    let nextPrayer = null;
    let nextPrayerTime: Date | null = null;
    let activePrayerKey: string | null = null;

    if (todayData) {
        // 1. Identify Next Prayer (for Countdown)
        for (const p of prayersList) {
            // Logic for Next Prayer Time source
            // If Friday Dhuhr, we track the *Iqamah*? Or Adhan?
            // Usually next prayer tracks Adhan time (start of time).
            // However, if we want to "know when next prayer is", standard is Adhan.
            // Let's stick to standard Adhan times for "Next Prayer" detection loop unless told otherwise.
            // User didn't specify special countdown logic for Friday Dhuhr, just display logic.

            let pTimeStr = p.key === "shuruq" ? (todayData as any).shuruq : (todayData as any)[p.key]?.adhan;
            const pDate = parseTime(pTimeStr);

            if (pDate && pDate > currentTime) {
                nextPrayer = p;
                nextPrayerTime = pDate;
                break;
            }
        }
        // If no next prayer today, it's Fajr tomorrow
        if (!nextPrayer) {
            const tomorrow = new Date(currentTime);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowKey = tomorrow.toISOString().split("T")[0];
            const tomorrowData = prayerSchedule[tomorrowKey];
            nextPrayer = prayersList[0];
            if (tomorrowData) {
                nextPrayerTime = parseTime(tomorrowData.fajr.adhan, tomorrow);
            }
        }

        // 2. Identify Active Prayer (for Highlighting)
        // "Highlight should always be on the prayer whose time we are currently in"
        // Find the last prayer where pDate <= currentTime
        // Note: This logic assumes prayers are sorted by time.
        for (let i = prayersList.length - 1; i >= 0; i--) {
            const p = prayersList[i];
            let pTimeStr = p.key === "shuruq" ? (todayData as any).shuruq : (todayData as any)[p.key]?.adhan;
            const pDate = parseTime(pTimeStr);

            if (pDate && pDate <= currentTime) {
                activePrayerKey = p.key;
                break;
            }
        }
        // Handle edge case: Before Fajr -> activePrayerKey might be null (or previous day Isha? Let's assume null/none highlighted)
    }

    // Formatting
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
    };

    return (
        <div className="flex flex-col h-full bg-[#050505] relative">
            <div className="flex-1 px-4 overflow-y-auto no-scrollbar pb-16 space-y-2 pt-2">
                <div className="flex gap-2">
                    <div className="flex-1 bg-[#0d1b13] border border-[#1a3525] rounded-xl p-3 flex justify-between items-center shadow-lg">
                        <button className="p-1 rounded-full hover:bg-[#13ec6d]/10 text-[#13ec6d]">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="text-center">
                            <h2 className="text-white font-black text-xl leading-none">{formatDate(currentTime)}</h2>
                            <p className="text-[#d4af37] text-xl font-bold mt-1">
                                {todayData?.hijri ? `${todayData.hijri} Hijri` : "Loading..."}
                            </p>
                        </div>
                        <button className="p-1 rounded-full hover:bg-[#13ec6d]/10 text-[#13ec6d]">
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Smart Alarm Button (Bell Icon) */}
                    <a href="/smart-alarm" className="bg-[#0d1b13] border border-[#1a3525] rounded-xl w-14 flex items-center justify-center text-[#13ec6d] hover:bg-[#13ec6d]/10 transition-colors shadow-lg">
                        <span className="material-symbols-outlined text-2xl">notifications</span>
                    </a>

                    {/* Settings Button */}
                    <a href="/sound-selection" className="bg-[#0d1b13] border border-[#1a3525] rounded-xl w-14 flex items-center justify-center text-[#13ec6d] hover:bg-[#13ec6d]/10 transition-colors shadow-lg">
                        <span className="material-symbols-outlined text-2xl">settings</span>
                    </a>
                </div>

                {/* Next Prayer Widget */}
                <CountdownWidget
                    nextPrayerName={nextPrayer?.name || "--"}
                    nextPrayerTime={nextPrayerTime ? nextPrayerTime.toISOString() : ""}
                />

                {/* Prayer List Layout */}
                <div className="space-y-0.5">
                    {/* List Header */}
                    <div className="grid grid-cols-[1.2fr_1fr_1fr] px-4 py-1 text-[#555] text-[15px] font-black uppercase tracking-widest">
                        <p>Prayer</p>
                        <p className="text-center text-[#555]">Adhan</p>
                        <p className="text-center text-[#555]">Iqamah</p>
                    </div>

                    <div className="space-y-1">
                        {prayersList.map((prayer) => {
                            // Determine Logic for this row
                            const data = prayer.key === "shuruq" ? null : (todayData as any)[prayer.key];

                            let displayName = prayer.name;
                            let displayAdhan = prayer.key === "shuruq" ? (todayData as any).shuruq : data?.adhan;
                            let displayIqamah = prayer.key === "shuruq" ? "" : data?.jamat;

                            // Override if Friday Dhuhr
                            if (isFriday && todayData && prayer.key === "dhuhr") {
                                displayName = dhuhrOverrideName;
                                displayIqamah = dhuhrOverrideIqamah;
                                // displayAdhan remains standard dhuhr adhan
                            }

                            // Check active state
                            const isActive = activePrayerKey === prayer.key;

                            // Check Sponsored State (Mock logic for now, or check data)
                            // Assuming data might have a 'sponsored' field in the future
                            const isSponsored = (data as any)?.sponsored || (prayer.key === "maghrib" && "Family A"); // Example mock for Maghrib

                            return (
                                <div
                                    key={prayer.key}
                                    className={`relative grid grid-cols-[1.2fr_1fr_1fr] items-center py-2 px-4 rounded-xl border transition-all overflow-hidden ${isActive
                                        ? "bg-[#1a3525]/80 border-[#13ec6d] shadow-[0_0_15px_-5px_#13ec6d]"
                                        : "bg-transparent border-transparent hover:bg-[#1a3525]/30 border-b-white/5"
                                        }`}
                                >
                                    {/* Prayer Name & Icon */}
                                    <div className="flex items-center gap-3 relative z-10">
                                        <span className={`material-symbols-outlined text-[20px] ${isActive ? "text-[#13ec6d]" : "text-[#13ec6d]"}`}>
                                            {prayer.icon}
                                        </span>
                                        <p className={`text-sm font-bold ${isActive ? "text-white text-xl" : "text-gray-300"}`}>
                                            {displayName}
                                        </p>
                                    </div>

                                    {/* Adhan Time */}
                                    <p className={`text-center font-black tracking-wide relative z-10 ${isActive ? "text-[#13ec6d] text-4xl" : "text-[#13ec6d]/80 text-3xl"}`}>
                                        {displayAdhan || "--:--"}
                                    </p>

                                    {/* Iqamah Time */}
                                    <p className={`text-center font-black tracking-wide relative z-10 ${isActive ? "text-[#13ec6d] text-4xl" : "text-[#13ec6d] text-3xl"}`}>
                                        {displayIqamah || ""}
                                    </p>

                                    {/* Sponsored Tag */}
                                    {isSponsored && (
                                        <div className="absolute top-1 right-2 z-0 opacity-20 pointer-events-none">
                                            <p className="text-[#d4af37] font-black text-2xl uppercase tracking-widest leading-none transform rotate-0">
                                                SPONSORED
                                            </p>
                                        </div>
                                    )}
                                    {isSponsored && (
                                        <div className="absolute bottom-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/50 to-transparent"></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Jummah Section */}
                <div className="pt-0 pb-4 mt-0">
                    <h3 className="text-center text-[#13ec6d] text-[13.5px] font-black uppercase tracking-[0.2em] mb-2 mt-1">Jummah</h3>
                    <div className="flex gap-3">
                        {JUMMAH_TIMES.map((jummah) => (
                            <div key={jummah.name} className="flex-1 bg-[#0d1b13] border border-[#13ec6d]/20 rounded-2xl p-3 flex flex-col items-center justify-center relative overflow-hidden group hover:border-[#13ec6d]/40 transition-colors">
                                <div className="absolute top-0 left-0 w-full h-1 bg-[#13ec6d]/20"></div>
                                <p className="text-[#13ec6d] text-[13.5px] font-black uppercase tracking-widest mb-1">{jummah.name}</p>
                                <p className="text-white text-3xl font-black mb-1 leading-none group-hover:scale-110 transition-transform">{jummah.time}</p>
                                <p className="text-[#13ec6d] text-[12px] font-bold uppercase">{jummah.label}</p>
                            </div>
                        ))}
                    </div>
                    {/* Scrolling Widget */}
                    <ScrollingWidget />
                </div>
            </div>
        </div>
    );
}
