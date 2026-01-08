import { db } from "@/lib/db";
import { evaluations, candidates, jobs } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
// Table components not installed, using native HTML table

// I likely didn't install table component. Use standard HTML or setup table component.
// Using standard HTML for simplicity to avoid overhead.

export const dynamic = "force-dynamic";

export default async function LogsPage() {
    const result = await db.select({
        id: evaluations.id,
        candidate: candidates.name,
        job: jobs.title,
        result: evaluations.result,
        score: evaluations.score,
        date: evaluations.createdAt
    })
        .from(evaluations)
        .leftJoin(candidates, eq(evaluations.candidateId, candidates.id))
        .leftJoin(jobs, eq(candidates.jobId, jobs.id))
        .orderBy(desc(evaluations.createdAt));

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">選考ログ</h1>
            <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="p-4 font-medium">日時</th>
                            <th className="p-4 font-medium">候補者</th>
                            <th className="p-4 font-medium">求人</th>
                            <th className="p-4 font-medium">結果</th>
                            <th className="p-4 font-medium">スコア</th>
                        </tr>
                    </thead>
                    <tbody>
                        {result.map((log) => (
                            <tr key={log.id} className="border-b hover:bg-gray-50">
                                <td className="p-4">{log.date?.toLocaleString()}</td>
                                <td className="p-4">{log.candidate}</td>
                                <td className="p-4">{log.job}</td>
                                <td className="p-4">
                                    <span className={log.result === "Strong Pass" ? "text-green-600 font-bold" : log.result === "Reject" ? "text-red-600 font-bold" : ""}>
                                        {log.result}
                                    </span>
                                </td>
                                <td className="p-4">{log.score}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
