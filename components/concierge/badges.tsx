import { Badge } from "@/components/ui/badge";
import { PRIORITY_LABEL, SOURCE_TYPE_LABEL, TASK_STATUS_LABEL } from "@/lib/concierge/format";

export function PriorityBadge({ priority }: { priority: string | null }) {
    const p = priority ?? "Low";
    const cls =
        p === "High"
            ? "bg-red-100 text-red-700 border-red-200"
            : p === "Medium"
            ? "bg-amber-100 text-amber-800 border-amber-200"
            : "bg-gray-100 text-gray-600 border-gray-200";
    return (
        <Badge className={cls} variant="outline">
            優先度: {PRIORITY_LABEL[p] ?? p}
        </Badge>
    );
}

export function SourceTypeBadge({ type }: { type: string }) {
    return (
        <Badge variant="secondary">{SOURCE_TYPE_LABEL[type] ?? type}</Badge>
    );
}

export function TaskStatusBadge({ status }: { status: string | null }) {
    const s = status ?? "todo";
    const cls =
        s === "done"
            ? "bg-green-100 text-green-700 border-green-200"
            : s === "waiting"
            ? "bg-purple-100 text-purple-700 border-purple-200"
            : s === "in_progress"
            ? "bg-blue-100 text-blue-700 border-blue-200"
            : "bg-gray-100 text-gray-600 border-gray-200";
    return (
        <Badge className={cls} variant="outline">
            {TASK_STATUS_LABEL[s] ?? s}
        </Badge>
    );
}
