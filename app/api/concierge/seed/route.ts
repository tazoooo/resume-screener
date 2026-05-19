import { NextResponse } from "next/server";
import { ensureSchema, syncOutlook } from "@/lib/concierge/service";

export const dynamic = "force-dynamic";

// GET /api/concierge/seed — テーブル作成 + Outlookモックデータ投入
export async function GET() {
    try {
        await ensureSchema();
        const result = await syncOutlook();
        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
