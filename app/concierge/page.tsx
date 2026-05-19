import Link from "next/link";
import { ensureSchema, getDashboardData } from "@/lib/concierge/service";
import { Card } from "@/components/ui/card";
import { PriorityBadge } from "@/components/concierge/badges";
import { ConnectButton } from "@/components/concierge/connect-button";
import { formatDate, formatDateTime } from "@/lib/concierge/format";
import {
    CalendarClock,
    Flame,
    Hourglass,
    Inbox as InboxIcon,
    AlertTriangle,
    Reply,
    Sun,
} from "lucide-react";

export const dynamic = "force-dynamic";

type TaskLike = {
    id: number;
    title: string;
    priority: string | null;
    status: string | null;
    dueDate: string | Date | null;
};

function TaskRow({ task }: { task: TaskLike }) {
    return (
        <Link
            href={`/concierge/tasks/${task.id}`}
            className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 hover:bg-gray-50 transition-colors"
        >
            <div className="flex items-center gap-2 min-w-0">
                <PriorityBadge priority={task.priority} />
                <span className="truncate text-sm font-medium">{task.title}</span>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
                {formatDate(task.dueDate)}
            </span>
        </Link>
    );
}

function Section({
    title,
    icon,
    count,
    empty,
    children,
}: {
    title: string;
    icon: React.ReactNode;
    count: number;
    empty: string;
    children: React.ReactNode;
}) {
    return (
        <Card className="p-5 gap-3">
            <div className="flex items-center gap-2">
                {icon}
                <h2 className="font-semibold">{title}</h2>
                <span className="ml-auto text-sm text-muted-foreground">{count}件</span>
            </div>
            {count === 0 ? (
                <p className="text-sm text-muted-foreground">{empty}</p>
            ) : (
                <div className="space-y-2">{children}</div>
            )}
        </Card>
    );
}

export default async function ConciergeDashboard() {
    let data;
    let dbError = "";
    try {
        await ensureSchema();
        data = await getDashboardData();
    } catch (e) {
        dbError = e instanceof Error ? e.message : String(e);
    }

    if (dbError) {
        return (
            <div className="container mx-auto py-10">
                <h1 className="text-2xl font-bold mb-2">Task Concierge</h1>
                <Card className="p-6 border-red-200 bg-red-50">
                    <p className="font-medium text-red-700">データベースに接続できません</p>
                    <p className="text-sm text-red-600 mt-1">{dbError}</p>
                    <p className="text-sm text-gray-600 mt-2">
                        Vercel の Storage で PostgreSQL を接続し、POSTGRES_URL を設定してください。
                    </p>
                </Card>
            </div>
        );
    }

    const d = data!;

    if (!d.connected) {
        return (
            <div className="container mx-auto py-16">
                <div className="max-w-xl mx-auto text-center space-y-4">
                    <h1 className="text-3xl font-bold">Task Concierge へようこそ</h1>
                    <p className="text-muted-foreground">
                        Outlookのメール・カレンダーを連携すると、AIがタスク候補を自動抽出し、
                        承認するだけで仕事が前に進みます。
                    </p>
                    <div className="pt-2">
                        <ConnectButton />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        ※ デモ環境のため、Microsoft Graph APIの代わりにモックの
                        メール・予定データを取り込みます。
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                <h1 className="text-2xl font-bold">ダッシュボード</h1>
                <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>対応中 {d.counts.active}</span>
                    <span>完了 {d.counts.done}</span>
                    <span>取込イベント {d.counts.sourceEvents}</span>
                </div>
            </div>

            {d.counts.candidates > 0 && (
                <Link href="/concierge/inbox">
                    <Card className="p-4 mb-6 flex items-center gap-3 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 transition-colors">
                        <InboxIcon className="h-5 w-5 text-indigo-600" />
                        <span className="text-sm font-medium text-indigo-800">
                            {d.counts.candidates}件のAIタスク候補が承認待ちです。Inboxで確認しましょう。
                        </span>
                    </Card>
                </Link>
            )}

            {d.risks.length > 0 && (
                <Card className="p-5 mb-6 gap-2 border-red-200 bg-red-50">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <h2 className="font-semibold text-red-700">AIリスク通知</h2>
                    </div>
                    <ul className="space-y-1">
                        {d.risks.map((r, i) => (
                            <li key={i} className="text-sm text-red-700">
                                <Link
                                    href={`/concierge/tasks/${r.taskId}`}
                                    className="hover:underline"
                                >
                                    「{r.title}」— {r.message}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                <Section
                    title="今日やるべきこと"
                    icon={<Sun className="h-5 w-5 text-amber-500" />}
                    count={d.todayTasks.length}
                    empty="本日対応が必要なタスクはありません。"
                >
                    {d.todayTasks.map((t) => (
                        <TaskRow key={t.id} task={t} />
                    ))}
                </Section>

                <Section
                    title="High Priority"
                    icon={<Flame className="h-5 w-5 text-red-500" />}
                    count={d.highPriority.length}
                    empty="高優先度タスクはありません。"
                >
                    {d.highPriority.map((t) => (
                        <TaskRow key={t.id} task={t} />
                    ))}
                </Section>

                <Section
                    title="未返信"
                    icon={<Reply className="h-5 w-5 text-orange-500" />}
                    count={d.noReply.length}
                    empty="未返信のタスクはありません。"
                >
                    {d.noReply.map((t) => (
                        <TaskRow key={t.id} task={t} />
                    ))}
                </Section>

                <Section
                    title="相手待ち"
                    icon={<Hourglass className="h-5 w-5 text-purple-500" />}
                    count={d.waiting.length}
                    empty="相手の対応待ちのタスクはありません。"
                >
                    {d.waiting.map((t) => (
                        <div key={t.id} className="space-y-1">
                            <TaskRow task={t} />
                            {t.waitingFor && (
                                <p className="pl-3 text-xs text-purple-600">待ち: {t.waitingFor}</p>
                            )}
                        </div>
                    ))}
                </Section>

                <Section
                    title="会議前準備"
                    icon={<CalendarClock className="h-5 w-5 text-blue-500" />}
                    count={d.upcomingMeetings.length + d.meetingPrep.length}
                    empty="直近の会議はありません。"
                >
                    {d.upcomingMeetings.map((m) => (
                        <div
                            key={`m-${m.id}`}
                            className="rounded-md border px-3 py-2 bg-blue-50/50"
                        >
                            <p className="text-sm font-medium">{m.title}</p>
                            <p className="text-xs text-muted-foreground">
                                {formatDateTime(m.eventTime)} 開始
                            </p>
                        </div>
                    ))}
                    {d.meetingPrep.map((t) => (
                        <TaskRow key={`p-${t.id}`} task={t} />
                    ))}
                </Section>

                <Card className="p-5 gap-3">
                    <div className="flex items-center gap-2">
                        <Sun className="h-5 w-5 text-indigo-500" />
                        <h2 className="font-semibold">クイックアクセス</h2>
                    </div>
                    <div className="space-y-2">
                        <Link
                            href="/concierge/inbox"
                            className="block rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                        >
                            Inbox — タスク候補の承認（{d.counts.candidates}件）
                        </Link>
                        <Link
                            href="/concierge/briefing"
                            className="block rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                        >
                            Daily Briefing — 朝夕の要約を見る
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    );
}
