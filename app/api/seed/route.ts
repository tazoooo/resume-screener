import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { jobs } from "@/lib/schema";

export const dynamic = "force-dynamic";

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

export async function GET() {
    try {
        // Create tables if they don't exist (Manual Migration for Vercel)
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS jobs (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                criteria JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

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

        await db.delete(jobs);

        for (const job of jobData) {
            await db.insert(jobs).values({
                title: job.title,
                description: job.description,
                criteria: job.criteria
            });
        }

        return NextResponse.json({ success: true, message: "Jobs seeded successfully" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
