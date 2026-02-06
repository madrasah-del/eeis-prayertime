"use client";
import { RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

const QUOTES = [
    { text: "Indeed, prayer prohibits immorality and wrongdoing, and the remembrance of Allah is greater.", source: "Surah Al-Ankabut (29:45)", location: "29:45" },
    { text: "So remember Me; I will remember you. And be grateful to Me and do not deny Me.", source: "Surah Al-Baqarah (2:152)", location: "2:152" },
    { text: "And whoever fears Allah - He will make for him a way out and will provide for him from where he does not expect.", source: "Surah At-Talaq (65:2-3)", location: "65:2-3" },
    { text: "Indeed, with hardship [will be] ease.", source: "Surah Ash-Sharh (94:6)", location: "94:6" },
];

export default function QuoteWidget() {
    const [quote, setQuote] = useState(QUOTES[0]);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    }, []);

    const refreshQuote = () => {
        setIsAnimating(true);
        const random = QUOTES[Math.floor(Math.random() * QUOTES.length)];
        setQuote(random);
        setTimeout(() => setIsAnimating(false), 500);
    };

    return (

        <div className="bg-gradient-to-r from-[#1a3525] to-[#102218] rounded-2xl p-4 border border-primary/20 relative overflow-hidden shadow-lg flex items-center justify-between gap-4">
            {/* Small watermark */}
            <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
                <span className="material-symbols-outlined text-6xl text-primary">menu_book</span>
            </div>

            <div className="flex-1">
                <h4 className="text-emerald-500/80 text-[10px] font-black uppercase mb-1 tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">format_quote</span>
                    Daily Wisdom
                </h4>
                <div key={quote.text} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <p className="text-foreground/90 text-sm italic font-medium leading-relaxed line-clamp-2">
                        "{quote.text}"
                    </p>

                    <p className="text-primary text-[10px] font-black tracking-wider mt-1 uppercase">— {quote.location}</p>
                </div>
            </div>

            <button
                onClick={refreshQuote}
                className="bg-primary/10 hover:bg-primary/20 p-2 rounded-full transition-colors flex-shrink-0"
            >
                <RefreshCw className={`h-4 w-4 text-primary ${isAnimating ? 'animate-spin' : ''}`} />
            </button>
        </div>
    );
}

