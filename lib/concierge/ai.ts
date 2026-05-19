/**
 * Task Concierge AIエージェント (要件定義書 §7)
 * 既存リポジトリに合わせて Google Gemini を利用する。
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Signals } from "./priority";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
    console.warn("Missing GOOGLE_GENERATIVE_AI_API_KEY — Task Concierge はフォールバック抽出を使用します。");
}

const genAI = new GoogleGenerativeAI(apiKey || "");
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    generationConfig: { responseMimeType: "application/json" },
});

export type ExtractedTask = {
    task_title: string;
    description: string;
    due_date: string; // "YYYY-MM-DD" または ""
    requester: string;
    reason: string;
    next_action: string;
    waiting_for: string; // 相手の返答待ちなら相手/内容、無ければ ""
    signals: Signals;
};

/** Geminiの応答テキストから JSON を頑健に取り出す。 */
function parseJson(text: string): unknown {
    const block = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (block) return JSON.parse(block[1]);

    const start = text.search(/[[{]/);
    if (start !== -1) {
        const open = text[start];
        const close = open === "[" ? "]" : "}";
        let balance = 0;
        for (let i = start; i < text.length; i++) {
            if (text[i] === open) balance++;
            else if (text[i] === close) {
                balance--;
                if (balance === 0) return JSON.parse(text.substring(start, i + 1));
            }
        }
    }
    throw new Error("Could not extract JSON from AI response");
}

export type EventInput = {
    sourceType: string;
    title: string | null;
    body: string | null;
    sender: string | null;
    eventTime: Date | null;
};

/**
 * Extractor Agent — メール・予定・議事録・メモからタスク候補を抽出。
 * 1件のイベントから複数タスクが出ることもあるため配列で返す。
 */
export async function extractTasks(event: EventInput): Promise<ExtractedTask[]> {
    const today = new Date().toISOString().slice(0, 10);
    const received = event.eventTime ? event.eventTime.toISOString() : "不明";

    const prompt = `あなたは優秀なAI秘書です。ユーザー本人（一人称「あなた」）の視点で、
受信した情報から「あなたが対応すべきタスク」だけを抽出してください。

# 今日の日付
${today}

# 入力情報
種別: ${event.sourceType}
件名/タイトル: ${event.title ?? ""}
送信者: ${event.sender ?? ""}
受信/開始日時: ${received}
本文:
${event.body ?? ""}

# 指示
- あなた本人のアクションが必要なタスクのみ抽出する。単なる情報共有・FYIだけならタスクは0件でよい。
- 会議の予定なら「事前準備のタスク」を抽出する。
- 議事録なら、あなたが担当することになったアクションアイテムを抽出する。
- due_date は本文から読み取り "YYYY-MM-DD" 形式。「本日中」は今日、「明日」は翌日。不明なら空文字。
- waiting_for は、あなたが既にボールを投げ相手の返答を待っている場合のみ相手と内容を記述。通常は空文字。
- signals の各フラグは boolean で判定する:
  - needsBeforeMeeting: 会議の前までに終わらせる必要がある
  - executiveRequest: 役員・経営層（CEO/役員等）からの依頼
  - waitingOnMe: あなたのアクション待ちで相手や業務が止まっている
  - replyOverdue48h: メールで、受信日時が今日から48時間以上前なのにまだ返信していない
  - contractHrBilling: 契約・採用・請求/支払いに関する案件
- reason は、なぜこのタスクが重要か/発生したかを日本語1〜2文で。
- next_action は、次に取るべき具体的な一手を日本語で簡潔に。

# 出力（JSONのみ。タスク配列）
{
  "tasks": [
    {
      "task_title": "",
      "description": "",
      "due_date": "",
      "requester": "",
      "reason": "",
      "next_action": "",
      "waiting_for": "",
      "signals": {
        "needsBeforeMeeting": false,
        "executiveRequest": false,
        "waitingOnMe": false,
        "replyOverdue48h": false,
        "contractHrBilling": false
      }
    }
  ]
}`;

    try {
        const result = await model.generateContent(prompt);
        const parsed = parseJson(result.response.text()) as { tasks?: ExtractedTask[] } | ExtractedTask[];
        const tasks = Array.isArray(parsed) ? parsed : parsed.tasks ?? [];
        return tasks.filter((t) => t && t.task_title).map(normalizeTask);
    } catch (error) {
        console.error("Extractor Agent error — フォールバック抽出を使用:", error);
        return [fallbackTask(event)];
    }
}

function normalizeTask(t: Partial<ExtractedTask>): ExtractedTask {
    return {
        task_title: t.task_title ?? "（無題のタスク）",
        description: t.description ?? "",
        due_date: typeof t.due_date === "string" ? t.due_date : "",
        requester: t.requester ?? "",
        reason: t.reason ?? "",
        next_action: t.next_action ?? "",
        waiting_for: t.waiting_for ?? "",
        signals: {
            needsBeforeMeeting: !!t.signals?.needsBeforeMeeting,
            executiveRequest: !!t.signals?.executiveRequest,
            waitingOnMe: !!t.signals?.waitingOnMe,
            replyOverdue48h: !!t.signals?.replyOverdue48h,
            contractHrBilling: !!t.signals?.contractHrBilling,
        },
    };
}

/** AIが使えないときの簡易抽出。 */
function fallbackTask(event: EventInput): ExtractedTask {
    const body = (event.body ?? "").slice(0, 200);
    return normalizeTask({
        task_title: event.title ?? "確認が必要な項目",
        description: body,
        requester: event.sender ?? "",
        reason: "AI抽出に失敗したため、元情報の件名からタスク候補を作成しました。",
        next_action: "内容を確認し、必要に応じてタスク内容を編集してください。",
    });
}

/**
 * Briefing Agent — タスク一覧から朝/夕の要約コメントを生成（best-effort）。
 * AIが使えない場合は空文字を返し、呼び出し側の定型サマリーのみ表示する。
 */
export async function generateBriefingComment(
    slot: "morning" | "evening",
    summaryText: string
): Promise<string> {
    if (!apiKey) return "";
    const when = slot === "morning" ? "朝" : "夕方";
    const prompt = `あなたはAI秘書です。${when}のブリーフィングとして、
以下のタスク状況をふまえ、ユーザーへの短い励ましと注意喚起のコメントを
日本語2〜3文で書いてください。JSON {"comment": "..."} のみ出力。

タスク状況:
${summaryText}`;
    try {
        const result = await model.generateContent(prompt);
        const parsed = parseJson(result.response.text()) as { comment?: string };
        return parsed.comment ?? "";
    } catch (error) {
        console.error("Briefing Agent error:", error);
        return "";
    }
}
