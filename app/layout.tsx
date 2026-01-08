import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Resume Screener AI",
    description: "Automated Resume Screening Tool",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja" suppressHydrationWarning>
            <body className={inter.className}>
                <nav className="border-b">
                    <div className="container mx-auto flex items-center h-16 px-4">
                        <Link href="/" className="font-bold text-xl mr-8">
                            ResumeAI
                        </Link>
                        <div className="flex gap-6 text-sm font-medium text-gray-600">
                            <Link href="/jobs" className="hover:text-black transition-colors">求人管理</Link>
                            <Link href="/candidates" className="hover:text-black transition-colors">候補者管理</Link>
                            <Link href="/logs" className="hover:text-black transition-colors">選考ログ</Link>
                        </div>
                    </div>
                </nav>
                <main className="min-h-screen bg-gray-50/50">
                    {children}
                </main>
            </body>
        </html>
    );
}
