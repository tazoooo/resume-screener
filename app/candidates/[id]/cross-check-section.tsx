"use client";

import { useState } from "react";
import { screenCandidateAgainstJob } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Job {
    id: number;
    title: string;
}

export const dynamic = "force-dynamic";

export function CrossCheckSection({ candidateId, jobs }: { candidateId: number, jobs: Job[] }) {
    const [selectedJobId, setSelectedJobId] = useState<string>("");
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string>("");

    if (jobs.length === 0) return null;

    const handleScreen = async (formData: FormData) => {
        setResult(null);
        setError("");

        const jobId = formData.get("jobId") as string;
        if (!jobId) return;

        const response = await screenCandidateAgainstJob(candidateId, parseInt(jobId));
        if (response.success) {
            setResult(response.data);
        } else {
            setError(response.error);
        }
    };

    return (
        <Card className="mt-8 border-dashed border-2 border-gray-300">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    🔄 他の求人での適正シミュレーション
                    <Badge variant="secondary">Beta</Badge>
                </CardTitle>
                <p className="text-sm text-gray-500">
                    現在の履歴書データを使って、別の求人の基準でAI判定を試すことができます。
                    <br />※結果は保存されません。
                </p>
            </CardHeader>
            <CardContent>
                <form action={handleScreen} className="flex gap-4 items-end mb-6">
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">比較する求人を選択</label>
                        <select
                            name="jobId"
                            className="w-full p-2 border rounded-md"
                            value={selectedJobId}
                            onChange={(e) => setSelectedJobId(e.target.value)}
                            required
                        >
                            <option value="">選択してください</option>
                            {jobs.map(job => (
                                <option key={job.id} value={job.id}>{job.title}</option>
                            ))}
                        </select>
                    </div>
                    <SubmitButton disabled={!selectedJobId}>シミュレーション実行</SubmitButton>
                </form>

                {error && <div className="text-red-500 font-bold mb-4">{error}</div>}

                {result && (
                    <div className={`p-4 rounded-lg border ${result.result === "Pass" ? "bg-green-50 border-green-200" : result.result === "Reject" ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"}`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">
                                判定結果: {result.result === "Pass" ? "合格" : result.result === "Reject" ? "見送り" : "要確認"}
                            </h3>
                            <Badge variant="outline" className="text-lg bg-white">{result.score} / 100</Badge>
                        </div>
                        <div className="prose prose-sm max-w-none bg-white p-4 rounded border">
                            {result.rationale?.split('\n').map((line: string, i: number) => <p key={i}>{line}</p>)}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
