import { Heart, CreditCard, Coffee } from "lucide-react";

export default function DonationWidget() {
    return (
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
            <div className="absolute top-4 right-4 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors">
                <Heart className="h-12 w-12" />
            </div>

            <div className="relative z-10">
                <h3 className="text-sm font-medium text-emerald-500 mb-2 uppercase tracking-wide flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Support Our Masjid
                </h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    Your generous contributions help us maintain the Masjid and serve the community.
                </p>

                <div className="flex flex-col gap-2">
                    <a
                        href="#"
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                        <CreditCard className="h-4 w-4" />
                        <span>Donate Online</span>
                    </a>
                    <a
                        href="#"
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-500 font-medium border border-emerald-500/20 hover:border-emerald-500/40 transition-all active:scale-95"
                    >
                        <Coffee className="h-4 w-4" />
                        <span>Sponsor Iftar</span>
                    </a>
                </div>
            </div>

            <div className="absolute -bottom-8 -right-8 h-24 w-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
        </div>
    );
}
