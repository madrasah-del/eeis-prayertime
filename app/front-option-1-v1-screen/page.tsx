import PrayerCard from "../components/dashboard/PrayerCard";
import QuoteWidget from "../components/dashboard/QuoteWidget";
import CountdownWidget from "../components/dashboard/CountdownWidget";

export default function FrontOption1V1() {
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
        <div className="flex flex-col gap-4 pb-4">
            {/* 1. Countdown Section */}
            <CountdownWidget nextPrayerName="Dhuhr" nextPrayerTime="13:10" />

            {/* 2. Prayer List Header */}
            <div className="relative z-10 px-8 pt-2 flex justify-between items-end pb-1 text-gray-400 text-xs font-black uppercase tracking-[0.2em]">
                <p>Prayer Name</p>
                <div className="flex gap-4 sm:gap-8 pr-2">
                    <p className="w-[4.5rem] text-center">Adhan</p>
                    <p className="w-[4.5rem] text-center">Iqamah</p>
                </div>
            </div>

            {/* 3. Prayer Grid */}
            <div className="flex flex-col gap-3 px-4">
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
            </div>

            {/* 4. Jummah Section */}
            <div className="relative z-10 px-4 pt-8">
                <h3 className="text-white text-2xl font-black leading-tight tracking-tight border-l-4 border-primary pl-4 uppercase mb-6">Friday Jummah</h3>
                <div className="flex gap-3 justify-center">
                    {jummahTimes.map((jummah) => (
                        <div key={jummah.name} className="flex-1 max-w-[170px] bg-primary/20 p-5 rounded-3xl border-2 border-primary/40 flex flex-col items-center text-center">
                            <p className="text-primary text-xl font-black uppercase mb-3 tracking-tighter">{jummah.name}</p>
                            <p className="text-white text-3xl font-black mb-1">{jummah.time}</p>
                            <p className="text-white/80 text-sm font-bold tracking-widest mt-1 uppercase">{jummah.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* 5. Daily Wisdom */}
            <div className="relative z-10 px-4 py-8">
                <QuoteWidget />
            </div>

            {/* Note: Bottom Nav is in Layout */}
        </div>
    );
}
