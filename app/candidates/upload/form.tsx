"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UploadForm({ jobs }: { jobs: any[] }) {
    const router = useRouter();
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setUploading(true);
        setResult(null);

        const formData = new FormData(event.currentTarget);

        try {
            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            const data = await response.json();
            if (data.success) {
                setResult(data);
                router.refresh();
                router.push("/candidates");
            } else {
                alert("Upload failed: " + data.error);
            }
        } catch (e) {
            alert("Error uploading file");
        } finally {
            setUploading(false);
        }
    }

    return (
        <Card className="max-w-xl mx-auto">
            <CardHeader>
                <CardTitle>候補者ドキュメントのアップロード</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">求人を選択</label>
                        <select name="jobId" className="w-full p-2 border rounded" required>
                            <option value="">-- 求人を選択してください --</option>
                            {jobs.map(job => (
                                <option key={job.id} value={job.id}>{job.title}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">候補者名（任意）</label>
                        <Input name="name" placeholder="空欄の場合はファイル名が使用されます" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">履歴書ファイル (PDF)</label>
                        <Input type="file" name="file" accept=".pdf" required />
                    </div>

                    <Button type="submit" disabled={uploading} className="w-full">
                        {uploading ? "アップロード中..." : "アップロード & 解析"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
