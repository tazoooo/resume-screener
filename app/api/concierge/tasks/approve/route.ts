import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, approveCandidate } from "@/lib/concierge/service";

export const dynamic = "force-dynamic";

// POST /api/concierge/tasks/approve — タスク承認（要件定義書 §9）
// body: { "candidate_id": number }
export async function POST(req: NextRequest) {
    try {
        await ensureSchema();
        const body = await req.json().catch(() => ({}));
        const candidateId = Number(body.candidate_id);
        if (!candidateId) {
            return NextResponse.json({ error: "candidate_id は必須です" }, { status: 400 });
        }
        const taskId = await approveCandidate(candidateId);
        return NextResponse.json({ success: true, taskId });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
