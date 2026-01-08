"use server";

import { db } from "@/lib/db";
import { jobs, candidates, evaluations } from "@/lib/schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, desc, sql } from "drizzle-orm";
import { screenCandidate } from "@/lib/ai";

const jobData = [
    {
        title: '企画営業_新卒',
        description: '学歴: 大卒以上\n年齢: 〜25歳',
        criteria: {
            "must": ["大卒以上", "〜25歳"],
            "want": [],
            "ng": [],
            "weights": { "must": 70, "want": 20, "experience": 10 }
        }
    },
    {
        title: '企画営業_第二新卒',
        description: '学歴: 出身高校偏差値50以上\n年齢: 〜26歳\n必須経歴: プロモーション企画、制作への興味関心があること（未経験OK）、オフィスソフト（ワード、エクセル、パワーポイント）が使用できる、ブラインドタッチ',
        criteria: {
            "must": ["出身高校偏差値50以上", "〜26歳", "プロモーション企画、制作への興味関心", "オフィスソフト（ワード、エクセル、パワーポイント）の使用", "ブラインドタッチ"],
            "want": [],
            "ng": ["転職回数3回以上"],
            "weights": { "must": 60, "want": 10, "experience": 30 }
        }
    },
    {
        title: '企画営業',
        description: '学歴: 出身高校偏差値50以上\n年齢: 50代以降NG\n必須経歴: 制作会社での就業経験3年以上、営業経験\n歓迎経歴: 広告制作会社での就業経験3年以上\n年収制限: 600万以上は案件持参必須',
        criteria: {
            "must": ["出身高校偏差値50以上", "制作会社での就業経験3年以上", "営業経験"],
            "want": ["広告制作会社での就業経験3年以上"],
            "ng": ["50代以上", "転職回数過多（25歳2回超、30歳3回超、35歳5回超、40歳7回超）", "3年以上働いた会社がない", "年収600万以上でクライアント持込不可"],
            "weights": { "must": 50, "want": 20, "experience": 30 }
        }
    },
    {
        title: 'プランナー_若手',
        description: '学歴: 出身高校偏差値50以上\n年齢: 26~39歳\n必須経歴: 広告代理店または、広告制作会社におけるプランナー経験あり（1年以上）\n経歴NG: 同業以外のプランナーNG（テレビも）',
        criteria: {
            "must": ["出身高校偏差値50以上", "26~39歳", "広告代理店または広告制作会社でのプランナー経験1年以上"],
            "want": [],
            "ng": ["転職回数過多", "3年以上働いた会社がない", "同業以外のプランナー経験（テレビ等）", "希望年収がレンジ外(400-600万以外)"],
            "weights": { "must": 50, "want": 10, "experience": 40 }
        }
    },
    {
        title: 'プランナー',
        description: '学歴: 出身高校偏差値50以上\n年齢: 26~49歳\n必須経歴: 広告代理店または、広告制作会社におけるプランナー経験あり（1年以上）\n歓迎経歴: 広告制作会社での就業経験3年以上\n年収制限: 700-800万',
        criteria: {
            "must": ["出身高校偏差値50以上", "26~49歳", "広告代理店または広告制作会社でのプランナー経験1年以上"],
            "want": ["広告制作会社での就業経験3年以上"],
            "ng": ["転職回数過多", "3年以上働いた会社がない", "同業以外のプランナー経験", "希望年収レンジ外(700-800万以外)"],
            "weights": { "must": 40, "want": 20, "experience": 40 }
        }
    },
    {
        title: '企画事業',
        description: '学歴: 出身高校偏差値50以上\n年齢: 26~49歳\n必須属性: オフィスソフト（ワード、エクセル、パワーポイント）が使用できる\n歓迎経歴: 代理店等でのAD実務経験2年以上、もしくは新規立ち上げ経験\n年収制限: 600万以上は案件持参必要',
        criteria: {
            "must": ["出身高校偏差値50以上", "26~49歳", "オフィスソフト（ワード、エクセル、パワーポイント）の使用"],
            "want": ["代理店等でのAD実務経験2年以上", "新規立ち上げ経験"],
            "ng": ["転職回数過多", "3年以上働いた会社がない", "年収600万以上で案件持込不可"],
            "weights": { "must": 40, "want": 30, "experience": 30 }
        }
    },
    {
        title: 'WEBデザイナー',
        description: '学歴: 出身高校偏差値50以上\n年齢: 26~49歳\n必須経歴: Webデザイン実務経験（3年以上）、Photoshop/Illustrator/Figma/XD、HTML/CSS基礎知識、PC・スマホ両方のデザイン経験、ポートフォリオ提出\n歓迎経歴: UI/UXデザイン経験\n年収制限: 420-840万',
        criteria: {
            "must": ["出身高校偏差値50以上", "26~49歳", "Webデザイン実務経験3年以上", "デザインツール(Photoshop/Illustrator/Figma/XD)の使用", "HTML/CSSの基礎知識", "PC・スマホ両方のデザイン経験", "ポートフォリオの提出"],
            "want": ["UI/UXデザイン経験"],
            "ng": ["転職回数過多", "3年以上働いた会社がない", "希望年収レンジ外(420-840万以外)"],
            "weights": { "must": 60, "want": 10, "experience": 30 }
        }
    },
    {
        title: 'WEBディレクター',
        description: '学歴: 出身高校偏差値50以上\n年齢: 26~49歳\n必須経歴: Web制作実務5年以上、Webディレクション実務、見積・スケジュール管理、クライアント折衝・プレゼン、ワイヤーフレーム作成、Web・HTML/CSS基礎知識\n歓迎経歴: ポートフォリオ提出\n年収制限: 490-840万',
        criteria: {
            "must": ["出身高校偏差値50以上", "26~49歳", "Web制作実務経験5年以上", "Webディレクション実務経験（要件定義〜納品）", "見積作成・スケジュール管理・制作進行の経験", "クライアント折衝・プレゼンテーションの経験", "ワイヤーフレーム／構成案の作成経験", "WebデザインやHTML/CSSの基礎知識"],
            "want": ["ポートフォリオの提出"],
            "ng": ["転職回数過多", "3年以上働いた会社がない", "希望年収レンジ外(490-840万以外)"],
            "weights": { "must": 60, "want": 10, "experience": 30 }
        }
    },
    {
        title: '広報スタッフ',
        description: '学歴: 大学生\n年齢: 18~29歳\n必須属性: 業界経験・広報経験不問、オフィスソフト（ワード、エクセル、パワーポイント）が使用できる',
        criteria: {
            "must": ["現役大学生", "18~29歳", "オフィスソフト（ワード、エクセル、パワーポイント）の使用"],
            "want": [],
            "ng": ["転職回数3回以上"],
            "weights": { "must": 70, "want": 0, "experience": 30 }
        }
    }
];

export async function resetDatabase() {
    try {
        console.log("Checking environment variables...");
        if (!process.env.POSTGRES_URL) {
            console.error("CRITICAL: POSTGRES_URL is missing!");
            return {
                success: false,
                error: "CRITICAL ERROR: POSTGRES_URL environment variable is NOT SET. Please connect a database in Vercel Storage settings."
            };
        }

        console.log("POSTGRES_URL exists (starts with):", process.env.POSTGRES_URL.substring(0, 10) + "...");

        // Reset Database: Drop all tables with Cascade
        console.log("Executing DROP TABLE...");
        await db.execute(sql`DROP TABLE IF EXISTS evaluations CASCADE;`);
        await db.execute(sql`DROP TABLE IF EXISTS candidates CASCADE;`);
        await db.execute(sql`DROP TABLE IF EXISTS jobs CASCADE;`);

        console.log("Executing CREATE TABLE jobs...");
        // Re-create tables
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS jobs (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                criteria JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        console.log("Executing CREATE TABLE candidates...");
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS candidates (
                id SERIAL PRIMARY KEY,
                job_id INTEGER REFERENCES jobs(id),
                name TEXT NOT NULL,
                email TEXT,
                document_path TEXT NOT NULL,
                parsed_text TEXT,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        console.log("Executing CREATE TABLE evaluations...");
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS evaluations (
                id SERIAL PRIMARY KEY,
                candidate_id INTEGER REFERENCES candidates(id),
                result TEXT NOT NULL,
                score INTEGER DEFAULT 0,
                rationale TEXT,
                details JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        console.log("Seeding initial data...");
        for (const job of jobData) {
            await db.insert(jobs).values({
                title: job.title,
                description: job.description,
                criteria: job.criteria
            });
        }
        console.log("Seeding complete.");

        revalidatePath("/jobs");
        return { success: true };
    } catch (error: any) {
        console.error("Reset DB Error Full:", error);
        return {
            success: false,
            error: `DB Error: ${error.message} (Code: ${error.code})`
        };
    }
}

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

export async function screenCandidateAgainstJob(candidateId: number, targetJobId: number) {
    const candidate = (await db.select().from(candidates).where(eq(candidates.id, candidateId)))[0];
    if (!candidate || !candidate.parsedText) {
        return { success: false, error: "Candidate text not found" };
    }

    const job = (await db.select().from(jobs).where(eq(jobs.id, targetJobId)))[0];
    if (!job) {
        return { success: false, error: "Target job not found" };
    }

    try {
        const result = await screenCandidate(job, candidate.parsedText);
        return { success: true, data: result };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
