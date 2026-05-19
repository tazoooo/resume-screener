import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function ConciergeLayout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <div className="border-b bg-white">
                <div className="container mx-auto flex items-center gap-6 h-12 px-4 text-sm">
                    <span className="flex items-center gap-1.5 font-semibold text-indigo-600">
                        <Sparkles className="h-4 w-4" />
                        Task Concierge
                    </span>
                    <div className="flex gap-5 text-gray-600">
                        <Link href="/concierge" className="hover:text-black transition-colors">
                            ダッシュボード
                        </Link>
                        <Link href="/concierge/inbox" className="hover:text-black transition-colors">
                            Inbox
                        </Link>
                        <Link href="/concierge/briefing" className="hover:text-black transition-colors">
                            ブリーフィング
                        </Link>
                    </div>
                </div>
            </div>
            {children}
        </div>
    );
}
