"use client";

import Link from "next/link";
import React, { useState, useEffect, useMemo } from "react";
import prayerScheduleRaw from "../data/prayer_schedule.json";
import { AUDIO_URLS } from "../hooks/useAdhan";

// Types
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

export default function SmartAlarmPage() {
    // --- 1. Prayer Schedule Data Integration ---
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    // Initialize on mount
    useEffect(() => {
        setCurrentTime(new Date());
        const interval = setInterval(() => setCurrentTime(new Date()), 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    // Get Today's Data
    const todayKey = currentTime ? currentTime.toISOString().split("T")[0] : "";
    const todayData = prayerSchedule[todayKey];

    // Parse Helpers
    const parseTime = (timeStr: string | undefined, date: Date | null = null) => {
        if (!timeStr || !date) return null;
        const [h, m] = timeStr.split(":").map(Number);
        const newDate = new Date(date);
        newDate.setHours(h, m, 0, 0);
        return newDate;
    };

    // --- 2. State Management ---
    // Morning Alarm
    const [morningEnabled, setMorningEnabled] = useState(true);
    const [morningMode, setMorningMode] = useState<"AFTER_FAJR" | "BEFORE_SHURUQ" | "BEFORE_JAMAT">("AFTER_FAJR");
    const [morningOffset, setMorningOffset] = useState(20); // mins
    const [morningSound, setMorningSound] = useState(Object.keys(AUDIO_URLS)[0]);
    const [morningLightAlarm, setMorningLightAlarm] = useState(false); // Light Alarm Logic
    const [screenBrightness, setScreenBrightness] = useState(0); // 0-100% Opacity

    // Bedtime Alarm
    const [bedtimeEnabled, setBedtimeEnabled] = useState(true);
    const [bedtimeOffset, setBedtimeOffset] = useState(60); // mins
    const [bedtimeSound, setBedtimeSound] = useState("Deep Rain Sleep");
    const [lightControl, setLightControl] = useState(true);

    // --- Flash Logic ---
    const triggerFlash = async () => {
        if (typeof navigator === 'undefined' || !('mediaDevices' in navigator)) return;

        try {
            // Request camera access for torch
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities();

            // Check for torch capability (cast to any for TS support on non-standard prop)
            if (!(capabilities as any).torch) {
                // If no torch, maybe just rely on screen flash?
                // For now, we clean up and exit.
                track.stop();
                return;
            }

            const flash = (count: number) => {
                if (count <= 0) {
                    track.stop();
                    return;
                }
                // Turn Torch ON
                track.applyConstraints({ advanced: [{ torch: true } as any] })
                    .then(() => {
                        setTimeout(() => {
                            // Turn Torch OFF
                            track.applyConstraints({ advanced: [{ torch: false } as any] })
                                .then(() => {
                                    setTimeout(() => flash(count - 1), 500); // Wait before next flash
                                });
                        }, 500); // 500ms ON
                    })
                    .catch(e => {
                        console.error("Torch error", e);
                        track.stop();
                    });
            };

            flash(4); // 4 times

        } catch (err) {
            console.error("Flash access denied or error:", err);
        }
    };

    // --- Effects --- (Moved below to access derived morningAlarmTime)


    // --- 3. Derived Logic ---


    // Times
    const fajrTime = useMemo(() => parseTime(todayData?.fajr.adhan, currentTime), [todayData, currentTime]);
    const fajrJamatTime = useMemo(() => parseTime(todayData?.fajr.jamat, currentTime), [todayData, currentTime]);
    const shuruqTime = useMemo(() => parseTime(todayData?.shuruq, currentTime), [todayData, currentTime]);
    const ishaTime = useMemo(() => parseTime(todayData?.isha.adhan, currentTime), [todayData, currentTime]);

    // --- Calculations ---

    // Constants
    const MIN_BEFORE_SHURUQ = 20; // Cannot set closer than 20 mins to Shuruq in 'BEFORE_SHURUQ' mode
    const MIN_BEFORE_JAMAT = 10; // Minimum 10 mins before Jamat

    // Constraint: Morning Alarm cannot be BEFORE Fajr, and cannot be AFTER (Shuruq - 20)

    // Calculate Morning Alarm Time
    let morningAlarmTime: Date | null = null;
    let morningMaxOffset = 0;
    let morningMinOffset = 0; // Dynamic min for slider
    let showPreFajrWarning = false;

    if (fajrTime && shuruqTime) {

        if (morningMode === "AFTER_FAJR") {
            const gapMins = (shuruqTime.getTime() - fajrTime.getTime()) / (1000 * 60);
            morningMaxOffset = Math.max(0, gapMins - MIN_BEFORE_SHURUQ);

            // Alarm = Fajr + Offset
            const safeOffset = Math.min(Math.max(0, morningOffset), morningMaxOffset);
            morningAlarmTime = new Date(fajrTime.getTime() + safeOffset * 60000);

        } else if (morningMode === "BEFORE_SHURUQ") {
            const gapMins = (shuruqTime.getTime() - fajrTime.getTime()) / (1000 * 60);
            morningMaxOffset = gapMins;
            morningMinOffset = MIN_BEFORE_SHURUQ;

            // Alarm = Shuruq - Offset
            let safeOffset = Math.max(morningMinOffset, morningOffset);
            safeOffset = Math.min(safeOffset, morningMaxOffset);
            morningAlarmTime = new Date(shuruqTime.getTime() - safeOffset * 60000);

        } else if (morningMode === "BEFORE_JAMAT" && fajrJamatTime) {
            // Logic: Up to 3 hours (180 mins) before Jammat
            // Slider represents: "Mins before Jammat"

            morningMaxOffset = 180; // 3 hours
            morningMinOffset = MIN_BEFORE_JAMAT; // Latest is 10 mins before

            // Clamp slider value
            // Allow user to drag up to 3 hours. Warning will show if < Fajr.
            // Ensure we don't go below min offset (too close to Jammat)
            let safeOffset = Math.max(morningMinOffset, morningOffset);
            // Cap at 180
            safeOffset = Math.min(safeOffset, morningMaxOffset);

            // Alarm = Jamat - Offset
            morningAlarmTime = new Date(fajrJamatTime.getTime() - safeOffset * 60000);

            // Check warning condition: Alarm < Fajr Adhan
            if (morningAlarmTime < fajrTime) {
                showPreFajrWarning = true;
            }
        }
    }

    // Calculate Bedtime Alarm Time
    // "After Isha ... any time up until midnight"
    let bedtimeAlarmTime: Date | null = null;
    let bedtimeMaxOffset = 0;

    if (ishaTime) {
        // Midnight (next day 00:00)
        const midnight = new Date(ishaTime);
        midnight.setHours(24, 0, 0, 0);

        const gapMins = (midnight.getTime() - ishaTime.getTime()) / (1000 * 60);
        bedtimeMaxOffset = gapMins;

        const safeOffset = Math.min(bedtimeOffset, bedtimeMaxOffset);
        bedtimeAlarmTime = new Date(ishaTime.getTime() + safeOffset * 60000);
    }

    // Calculate Sleep Duration
    // From: Bedtime Alarm today -> Morning Alarm (tomorrow? or same day?)
    // Logic: Bedtime is tonight (after Isha). Morning is tomorrow (after Fajr).
    // Let's assume the user is planning for the upcoming night cycle.
    // Bedtime Alarm (Today/Tonight) -----> Morning Alarm (Tomorrow Morning)
    let sleepDurationStr = "--h --m";

    if (bedtimeAlarmTime && morningAlarmTime) {
        // If morning alarm is calculated for "Today's" Fajr, we need to add 24hrs to make it "Tomorrow's" Morning Alarm
        // relative to "Tonight's" Bedtime
        // Assuming fajrTime above is derived from 'todayKey'.
        // If current time is e.g. 10PM, Fajr was 5AM today. Next Fajr is 5AM tomorrow.
        // Bedtime is 10PM tonight.

        const morningTomorrow = new Date(morningAlarmTime);
        morningTomorrow.setDate(morningTomorrow.getDate() + 1);

        const diffMs = morningTomorrow.getTime() - bedtimeAlarmTime.getTime();
        const totalMins = Math.floor(diffMs / (1000 * 60));
        const h = Math.floor(totalMins / 60);
        const m = totalMins % 60;
        sleepDurationStr = `${h}h ${m}m`;
    }

    // --- 3. Derived Logic - Effects ---

    // Monitor for Light Alarm Trigger
    useEffect(() => {
        if (!morningEnabled || !morningAlarmTime) return;

        const checkAlarm = () => {
            const now = new Date();
            const timeDiff = morningAlarmTime.getTime() - now.getTime(); // ms
            const minsDiff = timeDiff / 60000;

            // 1. Gradual Brightness (15 mins before)
            if (morningLightAlarm && minsDiff <= 15 && minsDiff > 0) {
                // 15 mins -> 0% ... 0 mins -> 100%
                // Inverse fraction
                const fraction = (15 - minsDiff) / 15; // 0 to 1
                // Clamp
                const b = Math.min(100, Math.max(0, fraction * 100));
                setScreenBrightness(b);
            } else if (minsDiff > 15 || minsDiff < -1) {
                // Reset if not in window
                setScreenBrightness(0);
            }

            // 2. Trigger Flash (At alarm time)
            if (morningLightAlarm && Math.abs(timeDiff) < 1000) {
                triggerFlash();
            }
        };

        const timer = setInterval(checkAlarm, 1000); // Check every second
        return () => clearInterval(timer);
    }, [morningAlarmTime, morningEnabled, morningLightAlarm]);

    // --- Formatting ---
    const formatTime = (date: Date | null) => {
        if (!date) return "--:--";
        return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const formatAMPM = (date: Date | null) => {
        if (!date) return { time: "--:--", ampm: "--" };
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const strTime = hours.toString().padStart(2, '0') + ':' + minutes.toString().padStart(2, '0');
        return { time: strTime, ampm };
    };

    if (!todayData) return <div className="p-10 text-center text-slate-500">Loading Prayer Data...</div>;

    const morningDisplay = formatAMPM(morningAlarmTime);
    const bedtimeDisplay = formatAMPM(bedtimeAlarmTime);

    // Font size for top card times (approx 30% smaller than 36px ~= 25px)
    const timeFontSize = "25px";

    // Calculate Fajr to Shuruq Duration (Fixed for the day)
    let fajrShuruqGapStr = "--h --m";
    if (fajrTime && shuruqTime) {
        const diffMs = shuruqTime.getTime() - fajrTime.getTime();
        const totalMins = Math.floor(diffMs / (1000 * 60));
        const h = Math.floor(totalMins / 60);
        const m = totalMins % 60;
        fajrShuruqGapStr = `${h}h ${m}m`;
    }

    return (
        <div className="flex flex-col h-full bg-[#f6f8f7] dark:bg-[#0a140e] transition-colors duration-300 font-display relative overflow-hidden">
            {/* Light Alarm Overlay */}
            <div
                className="absolute inset-0 z-50 pointer-events-none bg-white transition-opacity duration-1000 linear"
                style={{ opacity: screenBrightness / 100 }}
            />

            {/* Header */}
            <div className="flex items-center p-6 pb-2 justify-between sticky top-0 z-20 bg-[#f6f8f7] dark:bg-[#0a140e] border-b border-transparent dark:border-white/5">
                <Link href="/" className="text-slate-900 dark:text-white flex size-12 shrink-0 items-center">
                    <span className="material-symbols-outlined cursor-pointer text-3xl">arrow_back_ios</span>
                </Link>
                <h2 className="text-slate-900 dark:text-white text-2xl font-extrabold leading-tight tracking-tight flex-1 text-center uppercase">Smart Alarms</h2>
                <div className="flex w-12 items-center justify-end">
                    <span className="material-symbols-outlined text-[#13ec6d] text-3xl">auto_awesome</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-32 no-scrollbar">
                {/* Fajr & Shuruq Time Card */}
                <div className="px-5 py-4">
                    <div className="bg-white dark:bg-[#162a1e] rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-white/5">
                        <div className="flex justify-between items-center relative">
                            <div className="text-center z-10 bg-white dark:bg-[#162a1e] pr-4">
                                <p className="text-[1.1rem] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-black leading-none mb-3">Fajr</p>
                                <h3 className="font-black text-slate-900 dark:text-white tracking-tighter" style={{ fontSize: timeFontSize }}>{todayData.fajr.adhan}</h3>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="flex flex-col items-center">
                                    <span className="text-sm font-black text-[#13ec6d] bg-[#13ec6d]/10 px-4 py-1 rounded-xl whitespace-nowrap mb-1">{fajrShuruqGapStr}</span>
                                    <div className="flex items-center gap-1 w-20">
                                        <div className="h-[3px] flex-1 bg-[#13ec6d]/30"></div>
                                        <span className="material-symbols-outlined text-xs text-[#13ec6d] font-black">arrow_forward_ios</span>
                                        <div className="h-[3px] flex-1 bg-[#13ec6d]/30"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-center z-10 bg-white dark:bg-[#162a1e] pl-4">
                                <p className="text-[1.1rem] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-black leading-none mb-3">Shuruq</p>
                                <h3 className="font-black text-slate-900 dark:text-white tracking-tighter" style={{ fontSize: timeFontSize }}>{todayData.shuruq}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Morning Wake-up Section */}
                <div className="px-5 space-y-4 mt-2">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#13ec6d] text-3xl font-bold">wb_twilight</span>
                        <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Morning Wake-up</h3>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col gap-4 bg-white/50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-black uppercase text-slate-500 tracking-wider">Alarm On/Off</span>
                            <div className="flex items-center gap-4">
                                {morningMode !== "BEFORE_JAMAT" && (
                                    <button
                                        onClick={() => setMorningLightAlarm(!morningLightAlarm)}
                                        className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-all ${morningLightAlarm ? "bg-yellow-500/20 border-yellow-500 text-yellow-500" : "border-slate-300 dark:border-slate-600 text-slate-400"}`}
                                    >
                                        <span className="material-symbols-outlined text-lg">light_mode</span>
                                        <span className="text-[10px] font-black uppercase">Light</span>
                                    </button>
                                )}
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        checked={morningEnabled}
                                        onChange={(e) => setMorningEnabled(e.target.checked)}
                                        className="sr-only peer"
                                        type="checkbox"
                                    />
                                    <div className="w-16 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-8 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#13ec6d]"></div>
                                </label>
                            </div>
                        </div>
                        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl font-black text-[10px]">
                            <button
                                onClick={() => { setMorningMode("AFTER_FAJR"); setMorningOffset(10); }}
                                className={`flex-1 py-3 rounded-lg transition-colors whitespace-nowrap ${morningMode === "AFTER_FAJR" ? "bg-[#13ec6d] text-[#0a140e]" : "text-slate-500 dark:text-slate-400"}`}
                            >
                                AFTER FAJR
                            </button>
                            <button
                                onClick={() => { setMorningMode("BEFORE_SHURUQ"); setMorningOffset(30); }}
                                className={`flex-1 py-3 rounded-lg transition-colors whitespace-nowrap ${morningMode === "BEFORE_SHURUQ" ? "bg-[#13ec6d] text-[#0a140e]" : "text-slate-500 dark:text-slate-400"}`}
                            >
                                PRE-SHURUQ
                            </button>
                            <button
                                onClick={() => { setMorningMode("BEFORE_JAMAT"); setMorningOffset(15); }}
                                className={`flex-1 py-3 rounded-lg transition-colors whitespace-nowrap ${morningMode === "BEFORE_JAMAT" ? "bg-[#13ec6d] text-[#0a140e]" : "text-slate-500 dark:text-slate-400"}`}
                            >
                                PRE-JAMMAT
                            </button>
                        </div>
                    </div>

                    {/* Slider Card */}
                    <div className={`bg-white dark:bg-[#162a1e] rounded-3xl p-6 border-2 shadow-lg transition-all ${morningEnabled ? "border-[#13ec6d]/20 opacity-100" : "border-slate-200 dark:border-white/5 opacity-50 grayscale"} relative`}>
                        <div className="flex flex-col gap-4 mb-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xl text-[#13ec6d] font-black uppercase tracking-tight leading-none mb-2">
                                        {morningMode === "AFTER_FAJR" ? "Add to Fajr" :
                                            morningMode === "BEFORE_SHURUQ" ? "Prior to Shuruq" : "Prior to Jammat"}
                                    </p>
                                    <p className="text-3xl font-black text-[#13ec6d]">
                                        {morningMode === "AFTER_FAJR" ? "+" : "-"}{morningOffset} <span className="text-lg font-bold">mins</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[0.975rem] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-black mb-1">Alarm Time</p>
                                    <p className="text-5xl font-black text-[#fbbf24] tracking-tighter leading-none">{morningDisplay.time} <span className="text-xl">{morningDisplay.ampm}</span></p>
                                </div>
                            </div>

                            {/* Pre-Fajr Warning Text - Non-blocking */}
                            {showPreFajrWarning && (
                                <div className="text-center py-2 animate-in fade-in duration-300">
                                    <span className="text-red-500 font-black text-xs uppercase tracking-wider bg-red-500/10 px-3 py-1 rounded-lg">
                                        Using Pre-Adhan Time
                                    </span>
                                </div>
                            )}

                            <div className="py-4">
                                <input
                                    className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-[#13ec6d] custom-slider"
                                    max={Math.floor(morningMaxOffset)}
                                    min={morningMode === "AFTER_FAJR" ? 0 : morningMinOffset}
                                    type="range"
                                    value={morningOffset}
                                    onChange={(e) => setMorningOffset(Number(e.target.value))}
                                    disabled={!morningEnabled}
                                />
                            </div>
                            <div className="flex justify-between items-end mt-2">
                                <div className="flex flex-col">
                                    <span className="text-[0.975rem] uppercase font-black text-slate-400 mb-1">
                                        {morningMode === "AFTER_FAJR" ? "Fajr" :
                                            morningMode === "BEFORE_SHURUQ" ? "Shuruq" : "Fajr Jammat"}
                                    </span>
                                    <span className="text-4xl font-black text-slate-900 dark:text-white leading-none">
                                        {morningMode === "AFTER_FAJR" ? todayData.fajr.adhan :
                                            morningMode === "BEFORE_SHURUQ" ? todayData.shuruq : todayData.fajr.jamat}
                                    </span>
                                </div>
                                <span className="text-[23px] font-black opacity-70 text-[#13ec6d] uppercase tracking-wider bg-[#13ec6d]/10 px-3 py-1 rounded-lg">Max: {Math.floor(morningMaxOffset)}m</span>
                            </div>
                        </div>
                        <div className="relative z-10">
                            <select
                                value={morningSound}
                                onChange={(e) => setMorningSound(e.target.value)}
                                disabled={!morningEnabled}
                                className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl py-5 px-6 text-lg font-black appearance-none focus:ring-4 focus:ring-[#13ec6d]/30 text-slate-900 dark:text-white outline-none"
                            >
                                {Object.keys(AUDIO_URLS).map(key => (
                                    <option key={key} value={key}>{key}</option>
                                ))}
                            </select>
                            <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-3xl">unfold_more</span>
                        </div>
                    </div>
                </div>

                {/* Bedtime Alarm Section */}
                <div className="px-5 mt-10 space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#13ec6d] text-3xl font-bold">bedtime</span>
                        <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Bedtime Alarm</h3>
                    </div>
                    <div className="flex flex-col gap-4 bg-white/50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-black uppercase text-slate-500 tracking-wider">Alarm On/Off</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    checked={bedtimeEnabled}
                                    onChange={(e) => setBedtimeEnabled(e.target.checked)}
                                    className="sr-only peer"
                                    type="checkbox"
                                />
                                <div className="w-16 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-8 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#13ec6d]"></div>
                            </label>
                        </div>
                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest text-center py-1">Auto-sync with Isha active</div>
                    </div>

                    {/* Slider Card */}
                    <div className={`bg-white dark:bg-[#162a1e] rounded-3xl p-6 border-2 shadow-lg transition-all ${bedtimeEnabled ? "border-[#13ec6d]/20 opacity-100" : "border-slate-200 dark:border-white/5 opacity-50 grayscale"}`}>
                        <div className="flex flex-col gap-4 mb-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xl text-[#13ec6d] font-black uppercase tracking-tight leading-none mb-2">Add to Isha</p>
                                    <p className="text-3xl font-black text-[#13ec6d]">+ {bedtimeOffset} <span className="text-lg font-bold">mins</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[0.975rem] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-black mb-1">Alarm Time</p>
                                    <p className="text-5xl font-black text-[#fbbf24] tracking-tighter leading-none">{bedtimeDisplay.time} <span className="text-xl">{bedtimeDisplay.ampm}</span></p>
                                </div>
                            </div>
                            <div className="py-4">
                                <input
                                    className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-[#13ec6d] custom-slider"
                                    max={Math.floor(bedtimeMaxOffset)}
                                    min="0"
                                    type="range"
                                    value={bedtimeOffset}
                                    onChange={(e) => setBedtimeOffset(Number(e.target.value))}
                                    disabled={!bedtimeEnabled}
                                />
                            </div>
                            <div className="flex justify-between items-end mt-2">
                                <div className="flex flex-col">
                                    <span className="text-[0.975rem] uppercase font-black text-slate-400 mb-1">Isha</span>
                                    <span className="text-4xl font-black text-slate-900 dark:text-white leading-none">{todayData.isha.adhan}</span>
                                </div>
                                <span className="text-[23px] font-black opacity-70 text-[#13ec6d] uppercase tracking-wider bg-[#13ec6d]/10 px-3 py-1 rounded-lg">Max: {Math.floor(bedtimeMaxOffset)}m</span>
                            </div>
                        </div>
                        <div className="relative">
                            <select
                                value={bedtimeSound}
                                onChange={(e) => setBedtimeSound(e.target.value)}
                                disabled={!bedtimeEnabled}
                                className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl py-5 px-6 text-lg font-black appearance-none focus:ring-4 focus:ring-[#13ec6d]/30 text-slate-900 dark:text-white outline-none"
                            >
                                <option>Deep Rain Sleep</option>
                                <option>Surah Mulk Recitation</option>
                                <option>White Noise</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-3xl">unfold_more</span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-col gap-3">
                        <div className="bg-[#a855f7]/10 border-2 border-[#a855f7]/30 rounded-3xl p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#a855f7] font-bold text-3xl">timelapse</span>
                                <p className="text-[#a855f7] font-black uppercase tracking-wider text-sm">Est. Sleep</p>
                            </div>
                            <p className="text-3xl font-black text-[#a855f7] tracking-tighter">{sleepDurationStr}</p>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-[#f6f8f7] dark:bg-[#0a140e] border-t-2 border-slate-200 dark:border-white/5 space-y-4 mt-8 pb-32">
                    <div className="bg-[#13ec6d]/5 dark:bg-white/5 rounded-2xl p-4 flex items-start gap-4 border border-[#13ec6d]/20">
                        <span className="material-symbols-outlined text-[#13ec6d] text-xl mt-0.5">info</span>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-white/80 font-bold">
                            <span className="font-black text-[#13ec6d] uppercase inline">Smart Sync Active:</span>
                            Alarms shift daily with the EEIS timetable.
                        </p>
                    </div>
                    <p className="text-center text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.3em] font-black pt-2">Epsom & Ewell Islamic Society</p>
                </div>
            </div>
            {/* Styles for custom slider that need to be global or scoped */}
            <style>{`
                .custom-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 32px;
                    height: 32px;
                    background: #13ec6d;
                    border-radius: 50%;
                    cursor: pointer;
                    border: 4px solid white;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                }
            `}</style>
        </div>
    );
}
