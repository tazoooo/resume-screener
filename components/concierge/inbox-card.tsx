"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";
import { PriorityBadge } from "@/components/concierge/badges";
import { formatDate } from "@/lib/concierge/format";
import { Check, X, Pencil, Clock, CornerUpLeft } from "lucide-react";
import {
    approveTask,
    dismissTask,
    holdTask,
    reopenTask,
    saveCandidateEdit,
} from "@/app/concierge/actions";

type Candidate = {
    id: number;
    taskTitle: string;
    description: string | null;
    dueDate: string | Date | null;
    requester: string | null;
    priority: string | null;
    priorityScore: number | null;
    reason: string | null;
    nextAction: string | null;
    waitingFor: string | null;
    status: string | null;
};

function toDateInput(value: string | Date | null): string {
    if (!value) return "";
    const d = typeof value === "string" ? new Date(value) : value;
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
}

export function InboxCard({ candidate }: { candidate: Candidate }) {
    const [editing, setEditing] = useState(false);
    const c = candidate;
    const isHold = c.status === "hold";

    return (
        <Card className="p-5 gap-3">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <PriorityBadge priority={c.priority} />
                        <span className="text-xs text-muted-foreground">
                            スコア {c.priorityScore ?? 0} ／ 期限 {formatDate(c.dueDate)}
                        </span>
                        {isHold && (
                            <span className="text-xs text-amber-700 font-medium">保留中</span>
                        )}
                    </div>
                    <h3 className="text-lg font-semibold mt-1">{c.taskTitle}</h3>
                </div>
            </div>

            {c.description && (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.description}</p>
            )}

            <div className="text-sm text-gray-600 space-y-1">
                {c.requester && <p>依頼者: {c.requester}</p>}
                {c.reason && (
                    <p className="text-indigo-700">
                        <span className="font-medium">AI判断理由:</span> {c.reason}
                    </p>
                )}
                {c.nextAction && <p>次アクション: {c.nextAction}</p>}
                {c.waitingFor && <p className="text-purple-700">相手待ち: {c.waitingFor}</p>}
            </div>

            {editing && (
                <form action={saveCandidateEdit} className="space-y-2 border-t pt-3">
                    <input type="hidden" name="id" value={c.id} />
                    <Input name="taskTitle" defaultValue={c.taskTitle} placeholder="タスク名" />
                    <Textarea
                        name="description"
                        defaultValue={c.description ?? ""}
                        placeholder="説明"
                        rows={3}
                    />
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">期限</label>
                        <Input
                            type="date"
                            name="dueDate"
                            defaultValue={toDateInput(c.dueDate)}
                            className="w-auto"
                        />
                        <SubmitButton size="sm">保存</SubmitButton>
                    </div>
                </form>
            )}

            <div className="flex flex-wrap gap-2 border-t pt-3">
                <form action={approveTask}>
                    <input type="hidden" name="id" value={c.id} />
                    <SubmitButton size="sm">
                        <Check className="mr-1 h-4 w-4" />
                        承認
                    </SubmitButton>
                </form>
                <button
                    type="button"
                    onClick={() => setEditing((v) => !v)}
                    className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                    <Pencil className="mr-1 h-4 w-4" />
                    編集
                </button>
                {!isHold ? (
                    <form action={holdTask}>
                        <input type="hidden" name="id" value={c.id} />
                        <SubmitButton size="sm" variant="outline">
                            <Clock className="mr-1 h-4 w-4" />
                            保留
                        </SubmitButton>
                    </form>
                ) : (
                    <form action={reopenTask}>
                        <input type="hidden" name="id" value={c.id} />
                        <SubmitButton size="sm" variant="outline">
                            <CornerUpLeft className="mr-1 h-4 w-4" />
                            候補に戻す
                        </SubmitButton>
                    </form>
                )}
                <form action={dismissTask}>
                    <input type="hidden" name="id" value={c.id} />
                    <SubmitButton size="sm" variant="outline">
                        <X className="mr-1 h-4 w-4" />
                        却下
                    </SubmitButton>
                </form>
            </div>
        </Card>
    );
}
