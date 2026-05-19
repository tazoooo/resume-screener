import Link from "next/link";
import { ensureSchema, buildBriefing } from "@/lib/concierge/service";
import { Card } from "@/components/ui/card";
import { PriorityBadge } from "@/components/concierge/badges";
import { formatDate } from "@/lib/concierge/format";
import { Sun, Moon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BriefingPage({
    searchParams,
}: {
    searchParams: Promise<{ slot?: string }>;
}) {
    const { slot: slotParam } = await searchParams;
    const slot: "morning" | "evening" =
        slotParam === "evening" || slotParam === "morning"
            ? slotParam
            : new Date().getHours() < 15
            ? "morning"
            : "evening";

    let briefing;
    let dbError = "";
    try {
        await ensureSchema();
        briefing = await buildBriefing(slot);
    } catch (e) {
        dbError = e instanceof Error ? e.message : String(e);
    }

    if (dbError) {
        return (
            <div className="container mx-auto py-10 px-4">
                <h1 className="text-2xl font-bold mb-2">Daily Briefing</h1>
                <Card className="p-6 border-red-200 bg-red-50">
                    <p className="font-medium text-red-700">データベースに接続できません</p>
                    <p className="text-sm text-red-600 mt-1">{dbError}</p>
                </Card>
            </div>
        );
    }

    const b = briefing!;
    const d = b.data;
    const isMorning = slot === "morning";

    return (
        <div className="container mx-auto py-8 px-4 max-w-2xl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    {isMorning ? (
                        <Sun className="h-6 w-6 text-amber-500" />
                    ) : (
                        <Moon className="h-6 w-6 text-indigo-500" />
                    )}
                    {isMorning ? "朝のブリーフィング" : "夕方のブリーフィング"}
                </h1>
                <div className="flex gap-1 text-sm">
                    <Link
                        href="/concierge/briefing?slot=morning"
                        className={
                            "rounded-md border px-3 py-1.5 " +
                            (isMorning ? "bg-indigo-600 text-white border-indigo-600" : "")
                        }
                    >
                        朝
                    </Link>
                    <Link
                        href="/concierge/briefing?slot=evening"
                        className={
                            "rounded-md border px-3 py-1.5 " +
                            (!isMorning ? "bg-indigo-600 text-white border-indigo-600" : "")
                        }
                    >
                        夕方
                    </Link>
                </div>
            </div>

            {b.comment && (
                <Card className="p-5 mb-4 bg-indigo-50 border-indigo-200">
                    <p className="text-sm text-indigo-900 whitespace-pre-wrap">{b.comment}</p>
                </Card>
            )}

            <Card className="p-5 gap-3 mb-4">
                <h2 className="font-semibold">サマリー</h2>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    {b.lines.map((line, i) => (
                        <div key={i} className="rounded-md border px-3 py-2">
                            {line}
                        </div>
                    ))}
                </div>
            </Card>

            <Card className="p-5 gap-3 mb-4">
                <h2 className="font-semibold">
                    {isMorning ? "今日の重点タスク" : "本日中に片付けたいタスク"}
                </h2>
                {d.todayTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">対象のタスクはありません。</p>
                ) : (
                    <div className="space-y-2">
                        {d.todayTasks.map((t) => (
                            <Link
                                key={t.id}
                                href={`/concierge/tasks/${t.id}`}
                                className="flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-gray-50"
                            >
                                <PriorityBadge priority={t.priority} />
                                <span className="flex-1 truncate text-sm font-medium">
                                    {t.title}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {formatDate(t.dueDate)}
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </Card>

            {d.risks.length > 0 && (
                <Card className="p-5 gap-2 border-red-200 bg-red-50">
                    <h2 className="font-semibold text-red-700">注意が必要な項目</h2>
                    <ul className="space-y-1">
                        {d.risks.map((r, i) => (
                            <li key={i} className="text-sm text-red-700">
                                <Link href={`/concierge/tasks/${r.taskId}`} className="hover:underline">
                                    「{r.title}」— {r.message}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}
        </div>
    );
}
