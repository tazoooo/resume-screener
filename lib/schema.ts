import { sql } from "drizzle-orm";
import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

export const jobs = pgTable("jobs", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"), // JD Text
    criteria: jsonb("criteria").notNull(), // JSON: { must: [], want: [], ng: [], weights: {} }
    createdAt: timestamp("created_at").defaultNow(),
});

export const candidates = pgTable("candidates", {
    id: serial("id").primaryKey(),
    jobId: integer("job_id").references(() => jobs.id),
    name: text("name").notNull(), // Extracted or filename
    email: text("email"), // Optional, if extracted
    documentPath: text("document_path").notNull(),
    parsedText: text("parsed_text"), // Full extracted text
    status: text("status").default("pending"), // pending, screened
    createdAt: timestamp("created_at").defaultNow(),
});

export const evaluations = pgTable("evaluations", {
    id: serial("id").primaryKey(),
    candidateId: integer("candidate_id").references(() => candidates.id),
    result: text("result").notNull(), // Strong Pass, Pass, Hold, Reject
    score: integer("score").default(0),
    rationale: text("rationale"), // Explainability output
    details: jsonb("details"), // Full JSON analysis from AI
    createdAt: timestamp("created_at").defaultNow(),
});

/* ──────────────────────────────────────────────
 * Task Concierge — AI秘書ツール
 * 既存の Resume Screener とは独立したテーブル群（tc_ プレフィックス）
 * ────────────────────────────────────────────── */

export const tcUsers = pgTable("tc_users", {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name"),
    createdAt: timestamp("created_at").defaultNow(),
});

// Outlookメール・予定・メモ・議事録などの元情報
export const sourceEvents = pgTable("source_events", {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    sourceType: text("source_type").notNull(), // email | calendar | memo | transcript
    externalId: text("external_id"),
    title: text("title"),
    body: text("body"),
    sender: text("sender"),
    participants: jsonb("participants"), // string[]
    eventTime: timestamp("event_time"),
    rawJson: jsonb("raw_json"),
    extractedAt: timestamp("extracted_at"), // AI抽出済みなら日時
    createdAt: timestamp("created_at").defaultNow(),
});

// AI抽出直後のタスク候補
export const taskCandidates = pgTable("task_candidates", {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    sourceEventId: integer("source_event_id"),
    taskTitle: text("task_title").notNull(),
    description: text("description"),
    dueDate: timestamp("due_date"),
    requester: text("requester"),
    priority: text("priority"), // High | Medium | Low
    priorityScore: integer("priority_score").default(0),
    signals: jsonb("signals"), // 優先度判定に使った条件フラグ
    reason: text("reason"),
    nextAction: text("next_action"),
    waitingFor: text("waiting_for"),
    status: text("status").default("candidate"), // candidate | approved | dismissed | hold
    createdAt: timestamp("created_at").defaultNow(),
});

// 承認済みタスク
export const tcTasks = pgTable("tc_tasks", {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    taskCandidateId: integer("task_candidate_id"),
    sourceEventId: integer("source_event_id"),
    title: text("title").notNull(),
    description: text("description"),
    priority: text("priority"), // High | Medium | Low
    priorityScore: integer("priority_score").default(0),
    signals: jsonb("signals"),
    reason: text("reason"),
    nextAction: text("next_action"),
    status: text("status").default("todo"), // todo | in_progress | waiting | done
    dueDate: timestamp("due_date"),
    waitingFor: text("waiting_for"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
