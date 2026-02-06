export default function Header() {
    return (
        <header className="fixed top-0 right-0 z-30 ml-64 flex w-[calc(100%-16rem)] items-center justify-between border-b border-white/5 bg-background/50 px-6 py-4 backdrop-blur-md">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back to the EEIS Portal</p>
            </div>

            <div className="flex items-center gap-4">
                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground hover:bg-accent/80 transition-colors">
                    <span className="sr-only">Notifications</span>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                </button>

                <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-200 ring-2 ring-white/10">
                    <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground font-bold">
                        A
                    </div>
                </div>
            </div>
        </header>
    );
}
