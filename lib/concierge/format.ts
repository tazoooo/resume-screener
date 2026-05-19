/** クライアント・サーバー両用の表示ヘルパー（純粋関数のみ）。 */

export function formatDate(value: Date | string | null | undefined): string {
    if (!value) return "期限なし";
    const d = typeof value === "string" ? new Date(value) : value;
    if (isNaN(d.getTime())) return "期限なし";
    return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function formatDateTime(value: Date | string | null | undefined): string {
    if (!value) return "-";
    const d = typeof value === "string" ? new Date(value) : value;
    if (isNaN(d.getTime())) return "-";
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`;
}

export const PRIORITY_LABEL: Record<string, string> = {
    High: "高",
    Medium: "中",
    Low: "低",
};

export const SOURCE_TYPE_LABEL: Record<string, string> = {
    email: "メール",
    calendar: "予定",
    memo: "メモ",
    transcript: "議事録",
};

export const TASK_STATUS_LABEL: Record<string, string> = {
    todo: "未着手",
    in_progress: "対応中",
    waiting: "相手待ち",
    done: "完了",
};
