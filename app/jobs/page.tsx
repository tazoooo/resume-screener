import { getJobs } from "@/app/actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
    const jobs = await getJobs();

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">求人一覧</h1>
                <Link href="/jobs/new">
                    <Button>新規求人作成</Button>
                </Link>
            </div>

            <div className="grid gap-4">
                {jobs.length === 0 ? (
                    <p className="text-muted-foreground">求人が見つかりません。新規作成してください。</p>
                ) : (
                    jobs.map((job) => (
                        <div key={job.id} className="border p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                            <h2 className="text-xl font-semibold">{job.title}</h2>
                            <p className="text-gray-600 mt-2">{job.description}</p>
                            <div className="mt-4 flex gap-2">
                                <Link href={`/jobs/${job.id}`}>
                                    <Button variant="outline" size="sm">詳細を見る</Button>
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
