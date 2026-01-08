"use client";

import { createJob } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function NewJobPage() {
    const defaultCriteria = JSON.stringify(
        {
            must: ["実務経験3年以上", "ビジネスレベルの英語力"],
            want: ["Pythonの使用経験", "リーダー経験"],
            ng: ["週5日出社不可", "日本語が話せない"],
            weights: { must: 50, want: 30, experience: 20 },
        },
        null,
        2
    );

    return (
        <div className="container mx-auto py-8 max-w-2xl">
            <h1 className="text-3xl font-bold mb-6">新規求人作成</h1>
            <form action={createJob} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-1">求人タイトル</label>
                    <Input name="title" required placeholder="例: プロダクトマネージャー" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">募集要項 (JD)</label>
                    <Textarea name="description" required placeholder="募集要項の全文を貼り付けてください..." className="h-32" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">選考基準 (JSON設定)</label>
                    <p className="text-xs text-muted-foreground mb-2">必須(Must)/推奨(Want)/NG条件と重み付けを定義します。</p>
                    <Textarea name="criteria" required defaultValue={defaultCriteria} className="h-64 font-mono text-sm" />
                </div>

                <div className="flex justify-end gap-2">
                    <Button type="submit">求人を作成</Button>
                </div>
            </form>
        </div>
    );
}
