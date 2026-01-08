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
