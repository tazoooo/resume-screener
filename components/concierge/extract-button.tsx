"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Wand2 } from "lucide-react";
import { extractAll } from "@/app/concierge/actions";

export function ExtractButton({ pendingCount }: { pendingCount: number }) {
    const [pending, start] = useTransition();
    const [note, setNote] = useState("");
    const router = useRouter();

    return (
        <div className="flex items-center gap-3">
            <Button
                disabled={pending || pendingCount === 0}
                onClick={() =>
                    start(async () => {
                        const r = await extractAll();
                        setNote(
                            r.events > 0
                                ? `${r.events}件のイベントから${r.tasks}件のタスク候補を抽出しました。`
                                : "未抽出のイベントはありません。"
                        );
                        router.refresh();
                    })
                }
            >
                {pending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                )}
                AIでタスク抽出{pendingCount > 0 ? `（未処理 ${pendingCount}件）` : ""}
            </Button>
            {note && <p className="text-sm text-muted-foreground">{note}</p>}
        </div>
    );
}
