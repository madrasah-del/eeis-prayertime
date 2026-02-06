import Link from 'next/link';
import { Home, Users, BookOpen, Settings, Heart } from 'lucide-react';

const navigation = [
    { name: 'Prayer', href: '/', icon: Home },
    { name: 'Join', href: '/membership', icon: Users },
    { name: 'Learn', href: '/madrasah', icon: BookOpen },
    { name: 'Give', href: '/donations', icon: Heart },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar({ mobileMode = false }: { mobileMode?: boolean }) {
    // We are forcing mobile mode layout now as per requirements.
    // Constrained to parent container width by absolute positioning left-0 right-0.

    return (
        <nav className="absolute bottom-0 left-0 right-0 z-50 bg-neutral-900/90 backdrop-blur-xl border-t border-white/10 h-20 pb-4 w-full">
            <div className="grid grid-cols-5 h-full items-center justify-items-center">
                {navigation.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className="flex flex-col items-center justify-center p-2 text-muted-foreground hover:text-emerald-500 transition-colors group"
                    >
                        <item.icon className="h-6 w-6 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-medium uppercase tracking-wider">{item.name}</span>
                    </Link>
                ))}
            </div>
        </nav>
    );
}
