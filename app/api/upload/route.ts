import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { parseResume } from "@/lib/parser";
import { db } from "@/lib/db";
import { candidates } from "@/lib/schema";

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const jobId = formData.get("jobId") as string;
    const candidateName = (formData.get("name") as string) || file.name;

    if (!file) {
        return NextResponse.json({ error: "No file received." }, { status: 400 });
    }

    try {
        const buffer = Buffer.from(await file.arrayBuffer());

        // 1. Parse Text (in memory)
        const text = await parseResume(buffer);

        // 2. Upload to Vercel Blob
        const filename = `${Date.now()}_${file.name.replace(/\s/g, "_")}`;
        const blob = await put(filename, file, {
            access: 'public',
        });

        // 3. Save to DB (Postgres)
        const [inserted] = await db.insert(candidates).values({
            jobId: parseInt(jobId),
            name: candidateName,
            documentPath: blob.url, // Store the Blob URL
            parsedText: text,
            status: "pending",
        })
            .returning();

        return NextResponse.json({ success: true, candidate: inserted, textPreview: text.substring(0, 100) });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Failed to process file." }, { status: 500 });
    }
}
