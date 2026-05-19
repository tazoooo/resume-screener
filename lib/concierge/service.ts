import { db } from "@/lib/db";
import { tcUsers, sourceEvents, taskCandidates, tcTasks } from "@/lib/schema";
import { sql, eq, and, desc } from "drizzle-orm";
import { computePriority, daysUntil, type Signals } from "./priority";
import { extractTasks, generateBriefingComment } from "./ai";
import { MOCK_SOURCE_EVENTS } from "./seed-data";

const DEMO_USER = { email: "demo@taskconcierge.app", name: "デモユーザー" };
const ACTIVE_TASK_STATUSES = ["todo", "in_progress", "waiting"];

/** 4テーブルを冪等に作成する。 */
export async function ensureSchema() {
    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS tc_users (
            id SERIAL PRIMARY KEY,
            email TEXT NOT NULL,
            name TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);
    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS source_events (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            source_type TEXT NOT NULL,
            external_id TEXT,
            title TEXT,
            body TEXT,
            sender TEXT,
            participants JSONB,
            event_time TIMESTAMP,
            raw_json JSONB,
            extracted_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);
    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS task_candidates (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            source_event_id INTEGER,
            task_title TEXT NOT NULL,
            description TEXT,
            due_date TIMESTAMP,
            requester TEXT,
            priority TEXT,
            priority_score INTEGER DEFAULT 0,
            signals JSONB,
            reason TEXT,
            next_action TEXT,
            waiting_for TEXT,
            status TEXT DEFAULT 'candidate',
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);
    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS tc_tasks (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            task_candidate_id INTEGER,
            source_event_id INTEGER,
            title TEXT NOT NULL,
            description TEXT,
            priority TEXT,
            priority_score INTEGER DEFAULT 0,
            signals JSONB,
            reason TEXT,
            next_action TEXT,
            status TEXT DEFAULT 'todo',
            due_date TIMESTAMP,
            waiting_for TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
    `);
}

/** デモ用ユーザーを1人保証し、その user_id を返す。 */
export async function ensureDemoUser(): Promise<number> {
    const existing = await db.select().from(tcUsers).limit(1);
    if (existing.length > 0) return existing[0].id;
    const inserted = await db
        .insert(tcUsers)
        .values(DEMO_USER)
        .returning({ id: tcUsers.id });
    return inserted[0].id;
}

function parseDate(value: string | null | undefined): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
}

/* ──────────────── Microsoft連携（モック） ──────────────── */

/**
 * Outlook連携のシミュレーション。
 * 実装上は Microsoft Graph API から取得する source_events を、
 * モックデータから投入する。既に投入済みなら何もしない。
 */
export async function syncOutlook(): Promise<{ seeded: number; total: number }> {
    await ensureSchema();
    const userId = await ensureDemoUser();

    const current = await db
        .select({ id: sourceEvents.id })
        .from(sourceEvents)
        .where(eq(sourceEvents.userId, userId));

    if (current.length === 0) {
        const now = Date.now();
        for (const m of MOCK_SOURCE_EVENTS) {
            await db.insert(sourceEvents).values({
                userId,
                sourceType: m.sourceType,
                externalId: m.externalId,
                title: m.title,
                body: m.body,
                sender: m.sender,
                participants: m.participants,
                eventTime: new Date(now + m.eventOffsetHours * 3_600_000),
                rawJson: { mock: true, provider: "outlook" },
            });
        }
        return { seeded: MOCK_SOURCE_EVENTS.length, total: MOCK_SOURCE_EVENTS.length };
    }
    return { seeded: 0, total: current.length };
}

export async function getSourceEvents() {
    const userId = await ensureDemoUser();
    return db
        .select()
        .from(sourceEvents)
        .where(eq(sourceEvents.userId, userId))
        .orderBy(desc(sourceEvents.eventTime));
}

export async function isConnected(): Promise<boolean> {
    const events = await db.select({ id: sourceEvents.id }).from(sourceEvents).limit(1);
    return events.length > 0;
}

/* ──────────────── AI抽出 ──────────────── */

/** 1件の source_event からタスク候補を抽出して保存する。 */
export async function extractFromEvent(eventId: number): Promise<number> {
    const rows = await db.select().from(sourceEvents).where(eq(sourceEvents.id, eventId));
    const event = rows[0];
    if (!event) throw new Error(`source_event ${eventId} が見つかりません`);

    const extracted = await extractTasks({
        sourceType: event.sourceType,
        title: event.title,
        body: event.body,
        sender: event.sender,
        eventTime: event.eventTime,
    });

    for (const t of extracted) {
        const due = parseDate(t.due_date);
        const signals: Signals = t.signals ?? {};
        const { score, level } = computePriority(due, signals);
        await db.insert(taskCandidates).values({
            userId: event.userId,
            sourceEventId: event.id,
            taskTitle: t.task_title,
            description: t.description,
            dueDate: due,
            requester: t.requester || event.sender,
            priority: level,
            priorityScore: score,
            signals,
            reason: t.reason,
            nextAction: t.next_action,
            waitingFor: t.waiting_for || null,
            status: "candidate",
        });
    }

    await db
        .update(sourceEvents)
        .set({ extractedAt: new Date() })
        .where(eq(sourceEvents.id, eventId));

    return extracted.length;
}

/** 未抽出の source_event をすべて処理する。 */
export async function extractAllPending(): Promise<{ events: number; tasks: number }> {
    const userId = await ensureDemoUser();
    const pending = await db
        .select()
        .from(sourceEvents)
        .where(and(eq(sourceEvents.userId, userId), sql`${sourceEvents.extractedAt} IS NULL`));

    let tasks = 0;
    for (const event of pending) {
        tasks += await extractFromEvent(event.id);
    }
    return { events: pending.length, tasks };
}

/* ──────────────── Inbox（タスク候補） ──────────────── */

export async function getCandidates(status = "candidate") {
    const userId = await ensureDemoUser();
    return db
        .select()
        .from(taskCandidates)
        .where(and(eq(taskCandidates.userId, userId), eq(taskCandidates.status, status)))
        .orderBy(desc(taskCandidates.priorityScore));
}

export async function getCandidate(id: number) {
    const rows = await db.select().from(taskCandidates).where(eq(taskCandidates.id, id));
    return rows[0];
}

export async function approveCandidate(id: number): Promise<number> {
    const c = await getCandidate(id);
    if (!c) throw new Error(`task_candidate ${id} が見つかりません`);
    if (c.status === "approved") throw new Error("既に承認済みです");

    const inserted = await db
        .insert(tcTasks)
        .values({
            userId: c.userId,
            taskCandidateId: c.id,
            sourceEventId: c.sourceEventId,
            title: c.taskTitle,
            description: c.description,
            priority: c.priority,
            priorityScore: c.priorityScore,
            signals: c.signals,
            reason: c.reason,
            nextAction: c.nextAction,
            status: c.waitingFor ? "waiting" : "todo",
            dueDate: c.dueDate,
            waitingFor: c.waitingFor,
        })
        .returning({ id: tcTasks.id });

    await db
        .update(taskCandidates)
        .set({ status: "approved" })
        .where(eq(taskCandidates.id, id));

    return inserted[0].id;
}

export async function dismissCandidate(id: number) {
    await db.update(taskCandidates).set({ status: "dismissed" }).where(eq(taskCandidates.id, id));
}

export async function holdCandidate(id: number) {
    await db.update(taskCandidates).set({ status: "hold" }).where(eq(taskCandidates.id, id));
}

export async function reopenCandidate(id: number) {
    await db.update(taskCandidates).set({ status: "candidate" }).where(eq(taskCandidates.id, id));
}

/** Inbox上での編集。期限の変更に応じて優先度を再計算する。 */
export async function editCandidate(
    id: number,
    fields: { taskTitle?: string; description?: string; dueDate?: string }
) {
    const c = await getCandidate(id);
    if (!c) throw new Error(`task_candidate ${id} が見つかりません`);

    const due = fields.dueDate !== undefined ? parseDate(fields.dueDate) : c.dueDate;
    const { score, level } = computePriority(due, (c.signals as Signals) ?? {});

    await db
        .update(taskCandidates)
        .set({
            taskTitle: fields.taskTitle?.trim() || c.taskTitle,
            description: fields.description ?? c.description,
            dueDate: due,
            priority: level,
            priorityScore: score,
        })
        .where(eq(taskCandidates.id, id));
}

/* ──────────────── タスク ──────────────── */

export async function getTasks() {
    const userId = await ensureDemoUser();
    return db
        .select()
        .from(tcTasks)
        .where(eq(tcTasks.userId, userId))
        .orderBy(desc(tcTasks.priorityScore));
}

export async function getTask(id: number) {
    const rows = await db.select().from(tcTasks).where(eq(tcTasks.id, id));
    const task = rows[0];
    if (!task) return null;

    let event = null;
    if (task.sourceEventId) {
        const e = await db.select().from(sourceEvents).where(eq(sourceEvents.id, task.sourceEventId));
        event = e[0] ?? null;
    }
    return { task, event };
}

export async function setTaskStatus(id: number, status: string) {
    await db
        .update(tcTasks)
        .set({ status, updatedAt: new Date() })
        .where(eq(tcTasks.id, id));
}

/* ──────────────── Dashboard ──────────────── */

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export async function getDashboardData() {
    const userId = await ensureDemoUser();
    const allTasks = await db.select().from(tcTasks).where(eq(tcTasks.userId, userId));
    const events = await getSourceEvents();

    const active = allTasks.filter((t) => ACTIVE_TASK_STATUSES.includes(t.status ?? "todo"));
    const hasSignal = (t: (typeof allTasks)[number], key: keyof Signals) =>
        !!(t.signals as Signals)?.[key];

    const todayTasks = active.filter((t) => {
        const dd = daysUntil(t.dueDate);
        return (dd !== null && dd <= 0) || t.priority === "High";
    });
    const highPriority = active.filter((t) => t.priority === "High");
    const noReply = active.filter((t) => hasSignal(t, "replyOverdue48h"));
    const waiting = allTasks.filter((t) => t.status === "waiting");

    const upcomingMeetings = events.filter((e) => {
        if (e.sourceType !== "calendar") return false;
        const dd = daysUntil(e.eventTime);
        return dd !== null && dd >= 0 && dd <= 2;
    });
    const meetingPrep = active.filter((t) => hasSignal(t, "needsBeforeMeeting"));

    const risks = active
        .filter((t) => {
            const dd = daysUntil(t.dueDate);
            return dd !== null && dd < 0; // 期限超過
        })
        .map((t) => ({
            taskId: t.id,
            title: t.title,
            message: `期限を${Math.abs(daysUntil(t.dueDate)!)}日超過しています`,
        }))
        .concat(
            noReply.map((t) => ({
                taskId: t.id,
                title: t.title,
                message: "48時間以上返信していません。相手を待たせています",
            }))
        );

    const candidateCount = (
        await db
            .select({ id: taskCandidates.id })
            .from(taskCandidates)
            .where(and(eq(taskCandidates.userId, userId), eq(taskCandidates.status, "candidate")))
    ).length;

    return {
        connected: events.length > 0,
        counts: {
            active: active.length,
            done: allTasks.filter((t) => t.status === "done").length,
            candidates: candidateCount,
            sourceEvents: events.length,
        },
        todayTasks,
        highPriority,
        noReply,
        waiting,
        upcomingMeetings,
        meetingPrep,
        risks,
    };
}

/* ──────────────── Briefing ──────────────── */

export type Briefing = Awaited<ReturnType<typeof buildBriefing>>;

export async function buildBriefing(slot: "morning" | "evening") {
    const d = await getDashboardData();
    const lines = [
        `対応中タスク: ${d.counts.active}件`,
        `本日の重点: ${d.todayTasks.length}件`,
        `High優先度: ${d.highPriority.length}件`,
        `未返信: ${d.noReply.length}件`,
        `相手待ち: ${d.waiting.length}件`,
        `直近の会議: ${d.upcomingMeetings.length}件`,
        `AIリスク通知: ${d.risks.length}件`,
    ];
    const comment = await generateBriefingComment(slot, lines.join("\n"));
    return { slot, data: d, lines, comment };
}
