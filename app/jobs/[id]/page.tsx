import { getJob } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    const job = await getJob(id);

    if (!job) notFound();

    return (
        <div className="container mx-auto py-8">
            <div className="mb-6">
                <Link href="/jobs" className="text-gray-500 hover:underline">← 求人一覧に戻る</Link>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">{job.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="font-bold mb-2">概要</h3>
                        <p className="whitespace-pre-wrap text-gray-700">{job.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-bold mb-2">必須要件 (Must)</h3>
                            <ul className="list-disc pl-5">
                                {(job.criteria as any).must?.map((c: string, i: number) => (
                                    <li key={i}>{c}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold mb-2">歓迎要件 (Want)</h3>
                            <ul className="list-disc pl-5">
                                {(job.criteria as any).want?.map((c: string, i: number) => (
                                    <li key={i}>{c}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
