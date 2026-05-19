import { NextResponse } from "next/server";
import { ensureSchema, getSourceEvents } from "@/lib/concierge/service";

export const dynamic = "force-dynamic";

// GET /api/concierge/emails — Outlookメール取得（要件定義書 §9）
export async function GET() {
    try {
        await ensureSchema();
        const events = await getSourceEvents();
        const emails = events.filter((e) => e.sourceType === "email");
        return NextResponse.json({ emails });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
