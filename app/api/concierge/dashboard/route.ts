import { NextResponse } from "next/server";
import { ensureSchema, getDashboardData } from "@/lib/concierge/service";

export const dynamic = "force-dynamic";

// GET /api/concierge/dashboard — Dashboard取得（要件定義書 §9）
export async function GET() {
    try {
        await ensureSchema();
        const data = await getDashboardData();
        return NextResponse.json(data);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
