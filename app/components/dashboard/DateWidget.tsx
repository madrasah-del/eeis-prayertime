import { Calendar } from "lucide-react";

export default function DateWidget() {
    const date = new Date();
    const dateString = date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    // Placeholder for Hijri date - normally would use a library like 'moment-hijri' or an API
    const hijriDateString = "14 Rajab 1447 AH";

    return (
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-emerald-500 mb-1">Today's Date</p>
                    <h2 className="text-2xl font-bold text-foreground">{dateString}</h2>
                    <p className="text-lg text-muted-foreground mt-1 font-serif italic opacity-80">{hijriDateString}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <Calendar className="h-6 w-6" />
                </div>
            </div>
        </div>
    );
}
