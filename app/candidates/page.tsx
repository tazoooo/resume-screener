import { getCandidates, getJobs, runScreening } from "@/app/actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";

export default async function CandidatesPage({ searchParams }: { searchParams: { jobId?: string } }) {
    const jobId = searchParams.jobId ? parseInt(searchParams.jobId) : undefined;
    const candidates = await getCandidates(jobId);
    const jobs = await getJobs();

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">候補者一覧</h1>
                <div className="flex gap-2">
                    <Link href="/candidates/upload">
                        <Button>履歴書アップロード</Button>
                    </Link>
                </div>
            </div>

            <div className="flex gap-4 mb-6">
                <Link href="/candidates">
                    <Button variant={!jobId ? "default" : "outline"}>全ての求人</Button>
                </Link>
                {jobs.map(job => (
                    <Link key={job.id} href={`/candidates?jobId=${job.id}`}>
                        <Button variant={jobId === job.id ? "default" : "outline"}>{job.title}</Button>
                    </Link>
                ))}
            </div>

            <div className="border rounded-md">
                <div className="grid grid-cols-5 bg-gray-100 p-3 font-semibold text-sm">
                    <div className="col-span-2">氏名</div>
                    <div>ステータス</div>
                    <div>スコア</div>
                    <div>操作</div>
                </div>
                {candidates.map((c) => (
                    <div key={c.id} className="grid grid-cols-5 p-3 border-t items-center hover:bg-gray-50">
                        <div className="col-span-2">
                            <div className="font-medium">{c.name}</div>
                            <div className="text-xs text-gray-500">{c.documentPath}</div>
                        </div>
                        <div>
                            <Badge className={
                                c.result === "Pass" ? "bg-green-600 hover:bg-green-700" :
                                    c.result === "Review" ? "bg-yellow-500 hover:bg-yellow-600" :
                                        c.result === "Reject" ? "bg-gray-500 hover:bg-gray-600" :
                                            "bg-slate-200 text-slate-700 hover:bg-slate-300"
                            }>
                                {c.result === "Pass" ? "合格" : c.result === "Reject" ? "見送り" : c.result === "Review" ? "要確認" : "未対応"}
                            </Badge>
                        </div>
                        <div>
                            {c.score || "-"}
                        </div>
                        <div>
                            <form action={async () => {
                                "use server";
                                await runScreening(c.id);
                            }}>
                                <SubmitButton size="sm" variant="outline">
                                    {c.status === "screened" ? "再実行" : "AI選考を実行"}
                                </SubmitButton>
                            </form>
                            <Link href={`/candidates/${c.id}`} className="ml-2">
                                <Button size="sm" variant="ghost">詳細</Button>
                            </Link>
                        </div>
                    </div>
                ))}
                {candidates.length === 0 && (
                    <div className="p-8 text-center text-gray-500">候補者が見つかりません。</div>
                )}
            </div>
        </div>
    );
}
