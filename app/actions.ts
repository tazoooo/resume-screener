"use server";

import { db } from "@/lib/db";
import { jobs, candidates, evaluations } from "@/lib/schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { screenCandidate } from "@/lib/ai";

// JOBS
export async function createJob(formData: FormData) {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const criteriaJson = formData.get("criteria") as string;

    await db.insert(jobs).values({
        title,
        description,
        criteria: JSON.parse(criteriaJson),
    });

    revalidatePath("/jobs");
    redirect("/jobs");
}

export async function getJobs() {
    return await db.select().from(jobs);
}

export async function getJob(id: number) {
    const result = await db.select().from(jobs).where(eq(jobs.id, id));
    return result[0];
}

// CANDIDATES
export async function getCandidates(jobId?: number) {
    const baseQuery = db.select({
        id: candidates.id,
        jobId: candidates.jobId,
        name: candidates.name,
        documentPath: candidates.documentPath,
        status: candidates.status,
        createdAt: candidates.createdAt,
        score: evaluations.score,
        result: evaluations.result,
    })
        .from(candidates)
        .leftJoin(evaluations, eq(candidates.id, evaluations.candidateId));

    if (jobId) {
        return await baseQuery.where(eq(candidates.jobId, jobId)).orderBy(desc(candidates.createdAt));
    }
    return await baseQuery.orderBy(desc(candidates.createdAt));
}

export async function getCandidate(id: number) {
    const result = await db.select().from(candidates).where(eq(candidates.id, id));
    return result[0];
}

export async function getEvaluation(candidateId: number) {
    const result = await db.select().from(evaluations).where(eq(evaluations.candidateId, candidateId));
    return result[0];
}

// SCREENING
export async function runScreening(candidateId: number) {
    const candidate = (await db.select().from(candidates).where(eq(candidates.id, candidateId)))[0];
    if (!candidate || !candidate.parsedText || !candidate.jobId) return;

    const job = (await db.select().from(jobs).where(eq(jobs.id, candidate.jobId)))[0];
    if (!job) return;

    console.log(`Starting screening for candidate ${candidateId}`);
    const result = await screenCandidate(job, candidate.parsedText);
    console.log(`Screening completed for candidate ${candidateId}:`, result.result);

    // Check if evaluation exists, overwrite if so? or just insert new (for history). For now assume 1:1.
    // We'll delete old one first if exists to keep it simple
    await db.delete(evaluations).where(eq(evaluations.candidateId, candidateId));

    await db.insert(evaluations).values({
        candidateId: candidate.id,
        result: result.result,
        score: result.score,
        rationale: result.rationale,
        details: result,
    });

    await db.update(candidates).set({ status: "screened" }).where(eq(candidates.id, candidateId));
    revalidatePath("/candidates");
    revalidatePath(`/candidates/${candidateId}`);
}
