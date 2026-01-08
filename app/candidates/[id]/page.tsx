import { getCandidate, getEvaluation, getJob, runScreening } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    const candidate = await getCandidate(id);
    if (!candidate) notFound();

    const job = await getJob(candidate.jobId!);
    const evaluation = await getEvaluation(id);

    return (
        <div className="container mx-auto py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold">{candidate.name}</h1>
                        <p className="text-gray-500">応募求人: <Link href={`/jobs/${job?.id}`} className="underline">{job?.title}</Link></p>
                        <p className="text-sm text-gray-400 mt-1">ファイル: {candidate.documentPath}</p>
                    </div>
                    <div className="flex gap-2">
                        <form action={async () => {
                            "use server";
                            await runScreening(id);
                        }}>
                            <SubmitButton variant="default">{evaluation ? "AI選考を再実行" : "AI選考を実行"}</SubmitButton>
                        </form>
                    </div>
                </div>

                {evaluation && (
                    <Card className={evaluation.result === "Reject" ? "border-red-200 bg-red-50" : evaluation.result === "Pass" ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span>選考結果: {evaluation.result === "Pass" ? "合格" : evaluation.result === "Reject" ? "見送り" : "要確認"}</span>
                                <Badge variant="outline" className="text-lg">{evaluation.score} / 100</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <h3 className="font-semibold mb-2">判定理由</h3>
                            <div className="prose prose-sm max-w-none">
                                {evaluation.rationale?.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {(evaluation?.details as any) && (
                    <Card>
                        <CardHeader><CardTitle>詳細分析</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {(evaluation!.details as any).must_check && (
                                <div>
                                    <h4 className="font-semibold mb-2">必須要件チェック</h4>
                                    <ul className="list-disc pl-5 text-sm">
                                        {Object.entries((evaluation!.details as any).must_check).map(([req, status]: any) => {
                                            const statusLower = status.toLowerCase();
                                            const isMet = statusLower.includes("met");
                                            const jpStatus = isMet ? "OK" : statusLower.includes("missing") ? "NG" : "不明";
                                            return (
                                                <li key={req}>
                                                    <span className={isMet ? "text-green-600 font-bold" : "text-red-600 font-bold"}>[{jpStatus}]</span> {req}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}
                            {(evaluation!.details as any).risk_flags && (evaluation!.details as any).risk_flags.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-2 text-red-600">リスクフラグ</h4>
                                    <ul className="list-disc pl-5 text-sm text-red-600">
                                        {(evaluation!.details as any).risk_flags.map((flag: string, i: number) => (
                                            <li key={i}>{flag}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>抽出された履歴書テキスト</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-gray-100 p-4 rounded-md text-xs font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
                            {candidate.parsedText || "テキストが抽出されませんでした。"}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div>
                <Card>
                    <CardHeader><CardTitle>選考基準</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-4 text-sm">
                            <div>
                                <span className="font-bold">必須(Must):</span>
                                <ul className="list-disc pl-4">{(job?.criteria as any).must?.map((c: string) => <li key={c}>{c}</li>)}</ul>
                            </div>
                            <div>
                                <span className="font-bold">推奨(Want):</span>
                                <ul className="list-disc pl-4">{(job?.criteria as any).want?.map((c: string) => <li key={c}>{c}</li>)}</ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
