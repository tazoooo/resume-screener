import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, extractFromEvent, extractAllPending } from "@/lib/concierge/service";

export const dynamic = "force-dynamic";

// POST /api/concierge/extract — AIタスク抽出（要件定義書 §9）
// body: { "event_id": number }  event_id 省略時は未抽出イベントを全件処理
export async function POST(req: NextRequest) {
    try {
        await ensureSchema();
        const body = await req.json().catch(() => ({}));
        const eventId = Number(body.event_id);

        if (eventId) {
            const tasks = await extractFromEvent(eventId);
            return NextResponse.json({ success: true, eventId, tasks });
        }

        const result = await extractAllPending();
        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
