/**
 * 優先度ロジック (要件定義書 §8)
 *
 *  今日締切          +10
 *  明日締切          +8
 *  会議前必要        +7
 *  役員依頼          +7
 *  自分待ち          +6
 *  返信48h未対応     +5
 *  契約・採用・請求  +5
 *
 *  15以上 : High / 8〜14 : Medium / 7以下 : Low
 */

export type Signals = {
    needsBeforeMeeting?: boolean; // 会議前に必要
    executiveRequest?: boolean; // 役員依頼
    waitingOnMe?: boolean; // 自分待ち（自分のアクション待ち）
    replyOverdue48h?: boolean; // 受信から48h以上返信なし
    contractHrBilling?: boolean; // 契約・採用・請求に関する
};

export type PriorityLevel = "High" | "Medium" | "Low";

/** 今日を基準にした締切までの残り日数。期限なしは null。 */
export function daysUntil(due: Date | string | null | undefined): number | null {
    if (!due) return null;
    const d = typeof due === "string" ? new Date(due) : due;
    if (isNaN(d.getTime())) return null;
    const today = new Date();
    const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    const b = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    return Math.round((a - b) / 86_400_000);
}

export type PriorityResult = {
    score: number;
    level: PriorityLevel;
    reasons: string[];
};

export function computePriority(
    dueDate: Date | string | null | undefined,
    signals: Signals = {}
): PriorityResult {
    let score = 0;
    const reasons: string[] = [];

    const dd = daysUntil(dueDate);
    if (dd !== null) {
        if (dd <= 0) {
            score += 10;
            reasons.push("今日締切 (+10)");
        } else if (dd === 1) {
            score += 8;
            reasons.push("明日締切 (+8)");
        }
    }
    if (signals.needsBeforeMeeting) {
        score += 7;
        reasons.push("会議前に必要 (+7)");
    }
    if (signals.executiveRequest) {
        score += 7;
        reasons.push("役員依頼 (+7)");
    }
    if (signals.waitingOnMe) {
        score += 6;
        reasons.push("自分のアクション待ち (+6)");
    }
    if (signals.replyOverdue48h) {
        score += 5;
        reasons.push("返信48h未対応 (+5)");
    }
    if (signals.contractHrBilling) {
        score += 5;
        reasons.push("契約・採用・請求案件 (+5)");
    }

    let level: PriorityLevel = "Low";
    if (score >= 15) level = "High";
    else if (score >= 8) level = "Medium";

    return { score, level, reasons };
}
