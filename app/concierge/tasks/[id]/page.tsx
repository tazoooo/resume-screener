import Link from "next/link";
import { notFound } from "next/navigation";
import { ensureSchema, getTask } from "@/lib/concierge/service";
import { computePriority, type Signals } from "@/lib/concierge/priority";
import { Card } from "@/components/ui/card";
import { PriorityBadge, TaskStatusBadge, SourceTypeBadge } from "@/components/concierge/badges";
import { TaskStatusControl } from "@/components/concierge/task-status-control";
import { formatDate, formatDateTime } from "@/lib/concierge/format";

export const dynamic = "force-dynamic";

export default async function TaskDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) notFound();

    await ensureSchema();
    const result = await getTask(id);
    if (!result || !result.task) notFound();

    const { task, event } = result;
    const priority = computePriority(task.dueDate, (task.signals as Signals) ?? {});

    return (
        <div className="container mx-auto py-8 px-4 max-w-3xl">
            <Link href="/concierge" className="text-sm text-gray-500 hover:underline">
                ← ダッシュボードに戻る
            </Link>

            <div className="flex items-center gap-2 mt-4 mb-2 flex-wrap">
                <PriorityBadge priority={task.priority} />
                <TaskStatusBadge status={task.status} />
                <span className="text-sm text-muted-foreground">
                    優先度スコア {task.priorityScore ?? 0}
                </span>
            </div>
            <h1 className="text-2xl font-bold mb-4">{task.title}</h1>

            <Card className="p-5 gap-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-muted-foreground">期限</p>
                        <p className="font-medium">{formatDate(task.dueDate)}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">ステータス</p>
                        <p className="font-medium">
                            <TaskStatusBadge status={task.status} />
                        </p>
                    </div>
                </div>

                {task.description && (
                    <div>
                        <p className="text-muted-foreground text-sm mb-1">説明</p>
                        <p className="whitespace-pre-wrap text-sm">{task.description}</p>
                    </div>
                )}

                {task.waitingFor && (
                    <div className="rounded-md bg-purple-50 border border-purple-200 px-3 py-2">
                        <p className="text-sm text-purple-700">
                            <span className="font-medium">相手待ち:</span> {task.waitingFor}
                        </p>
                    </div>
                )}
            </Card>

            <Card className="p-5 gap-3 mb-4">
                <h2 className="font-semibold">AIの判断</h2>
                {task.reason && (
                    <p className="text-sm text-indigo-700">{task.reason}</p>
                )}
                {task.nextAction && (
                    <div>
                        <p className="text-muted-foreground text-sm">次に取るべきアクション</p>
                        <p className="text-sm font-medium">{task.nextAction}</p>
                    </div>
                )}
                <div>
                    <p className="text-muted-foreground text-sm mb-1">優先度の内訳</p>
                    {priority.reasons.length > 0 ? (
                        <ul className="text-sm space-y-0.5">
                            {priority.reasons.map((r, i) => (
                                <li key={i}>・{r}</li>
                            ))}
                            <li className="font-medium pt-1">
                                合計 {priority.score}点 → {priority.level}
                            </li>
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            加点条件に該当なし（{priority.score}点 → {priority.level}）
                        </p>
                    )}
                </div>
            </Card>

            {event && (
                <Card className="p-5 gap-2 mb-4">
                    <div className="flex items-center gap-2">
                        <h2 className="font-semibold">関連する元情報</h2>
                        <SourceTypeBadge type={event.sourceType} />
                    </div>
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                        {event.sender} ／ {formatDateTime(event.eventTime)}
                    </p>
                    {event.body && (
                        <p className="text-sm whitespace-pre-wrap text-gray-700 border-t pt-2 mt-1">
                            {event.body}
                        </p>
                    )}
                </Card>
            )}

            <Card className="p-5 gap-3">
                <h2 className="font-semibold">ステータスを更新</h2>
                <TaskStatusControl taskId={task.id} current={task.status ?? "todo"} />
            </Card>
        </div>
    );
}
