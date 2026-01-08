"use client";

import { useState } from "react";
import { resetDatabase } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

export default function AdminPage() {
    const [status, setStatus] = useState<string>("");

    const handleReset = async () => {
        try {
            setStatus("実行中...");
            const result = await resetDatabase();
            if (result.success) {
                setStatus("成功しました！データベースが初期化されました。");
            } else {
                setStatus("エラー (Server): " + result.error);
            }
        } catch (e: any) {
            setStatus("エラー (Client): " + e.message);
        }
    };

    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-8">管理画面</h1>
            <div className="bg-white p-6 rounded-lg shadow-md border">
                <h2 className="text-xl font-semibold mb-4 text-red-600">データベース初期化</h2>
                <p className="mb-6 text-gray-700">
                    データベースのテーブルを作成し、初期データを投入します。<br />
                    <span className="font-bold">注意: 既存のすべてのデータ（候補者、評価結果など）は削除されます。</span>
                </p>

                <form action={handleReset}>
                    <SubmitButton>初期化を実行する</SubmitButton>
                </form>

                {status && (
                    <div className="mt-4 p-4 bg-gray-100 rounded text-lg font-bold">
                        {status}
                    </div>
                )}
            </div>
        </div>
    );
}
