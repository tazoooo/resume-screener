"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { TASK_STATUS_LABEL } from "@/lib/concierge/format";
import { setTaskStatusAction } from "@/app/concierge/actions";

const STATUSES = ["todo", "in_progress", "waiting", "done"];

export function TaskStatusControl({
    taskId,
    current,
}: {
    taskId: number;
    current: string;
}) {
    const [pending, start] = useTransition();
    const router = useRouter();

    return (
        <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => {
                const active = s === current;
                return (
                    <button
                        key={s}
                        type="button"
                        disabled={pending || active}
                        onClick={() =>
                            start(async () => {
                                await setTaskStatusAction(taskId, s);
                                router.refresh();
                            })
                        }
                        className={
                            "rounded-md border px-3 py-1.5 text-sm transition-colors disabled:opacity-100 " +
                            (active
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "hover:bg-gray-50")
                        }
                    >
                        {TASK_STATUS_LABEL[s]}
                    </button>
                );
            })}
        </div>
    );
}
