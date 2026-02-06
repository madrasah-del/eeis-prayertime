import PrayerCard from "../components/dashboard/PrayerCard";
import QuoteWidget from "../components/dashboard/QuoteWidget";
import CountdownWidget from "../components/dashboard/CountdownWidget";

export default function FrontOption2V2() {
    const prayers = [
        { name: "Fajr", adhanTime: "05:12", jamatTime: "05:45", icon: "wb_twilight" },
        { name: "Shuruq", adhanTime: "06:45", jamatTime: "06:45", isSunrise: true, icon: "light_mode" },
        { name: "Dhuhr", adhanTime: "13:10", jamatTime: "13:30", isActive: true, icon: "sunny" },
        { name: "Asr", adhanTime: "16:45", jamatTime: "17:00", icon: "wb_sunny" },
        { name: "Maghrib", adhanTime: "19:55", jamatTime: "20:00", icon: "dark_mode", sponsored: "Family A" },
        { name: "Isha", adhanTime: "21:30", jamatTime: "21:45", icon: "bedtime" },
    ];

    const jummahTimes = [
        { name: "1st Jummah", time: "12:40", label: "Iqamah" },
        { name: "2nd Jummah", time: "13:15", label: "Iqamah" },
    ];

    return (
        <div className="flex flex-col h-full">
            {/* 1. Top Section: Countdown only */}
            <div className="px-4 shrink-0 mb-3">
                <CountdownWidget nextPrayerName="Dhuhr" nextPrayerTime="13:10" />
            </div>

            {/* 2. Prayer Grid - Main visual weight */}
            <div className="flex-1 px-4 overflow-y-auto no-scrollbar pb-4 space-y-2">
                {/* Small Column Headers + Settings Icon */}
                <div className="flex justify-between items-end px-4 pb-1 text-gray-500/50 text-[10px] font-black uppercase tracking-widest">
                    <p>Prayer</p>
                    <div className="flex gap-4 sm:gap-8 pr-2 items-center">
                        <span className="material-symbols-outlined text-primary cursor-pointer hover:text-primary/80 transition-colors" title="Sound Settings">tune</span>
                        <p className="w-[4.5rem] text-center">Adhan</p>
                        <p className="w-[4.5rem] text-center">Iqamah</p>
                    </div>
                </div>

                {prayers.map((prayer) => (
                    <PrayerCard
                        key={prayer.name}
                        name={prayer.name}
                        adhanTime={prayer.adhanTime}
                        jamatTime={prayer.jamatTime}
                        isActive={prayer.isActive}
                        isSunrise={prayer.isSunrise}
                        icon={prayer.icon}
                        sponsored={(prayer as any).sponsored}
                    />
                ))}

                {/* 3. Jummah Section - Bigger Blocks (40% larger) */}
                <div className="pt-6 pb-2">
                    <h3 className="text-foreground/60 text-xs font-black border-l-2 border-primary pl-2 uppercase mb-4 tracking-widest">Friday Jummah</h3>
                    <div className="flex gap-4">
                        {jummahTimes.map((jummah) => (
                            <div key={jummah.name} className="flex-1 bg-primary/10 p-6 rounded-2xl border border-primary/20 flex flex-col items-center text-center">
                                <p className="text-foreground text-3xl font-black mb-1 leading-none">{jummah.time}</p>
                                <p className="text-primary text-xs font-black uppercase tracking-tight">{jummah.name}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. Quote Widget - Moved to Bottom */}
                <div className="pt-2 pb-6">
                    <QuoteWidget />
                </div>
            </div>

            {/* Note: Bottom Nav is in Layout overlap */}
        </div>
    );
}
