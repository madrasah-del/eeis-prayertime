"use client";
import { useEffect, useState } from "react";

const MESSAGES = [
    "Indeed, prayer prohibits immorality and wrongdoing.",
    "Jummah Khutbah begins at 12:40 PM.",
    "Please donate to support the mosque expansion.",
    "Community Iftar this Saturday at Maghrib.",
    "Mobile phones should be switched to silent."
];

export default function ScrollingWidget() {
    return (
        <div className="w-full bg-[#1a3525]/50 border-t border-[#13ec6d]/10 overflow-hidden py-2 mt-4 rounded-xl">
            <div className="whitespace-nowrap animate-marquee flex gap-12">
                {/* Duplicated list for seamless loop */}
                {[...MESSAGES, ...MESSAGES].map((msg, i) => (
                    <span key={i} className="text-[#13ec6d]/80 text-lg font-medium italic tracking-wide">
                        {msg} •
                    </span>
                ))}
            </div>
            {/* Inline style for marquee animation since tailwind config might not have it yet */}
            <style jsx>{`
                .animate-marquee {
                    animation: marquee 20s linear infinite;
                }
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </div>
    );
}
