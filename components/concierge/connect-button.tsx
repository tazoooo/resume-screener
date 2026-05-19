"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Mail } from "lucide-react";
import { connectMicrosoft } from "@/app/concierge/actions";

export function ConnectButton({ reconnect = false }: { reconnect?: boolean }) {
    const [pending, start] = useTransition();
    const [note, setNote] = useState("");
    const router = useRouter();

    return (
        <div className="flex flex-col items-center gap-2">
            <Button
                size="lg"
                disabled={pending}
                onClick={() =>
                    start(async () => {
                        const r = await connectMicrosoft();
                        setNote(
                            r.seeded > 0
                                ? `Outlookから${r.seeded}件のメール・予定を取り込みました。`
                                : `連携済みです（${r.total}件）。`
                        );
                        router.refresh();
                    })
                }
            >
                {pending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Mail className="mr-2 h-4 w-4" />
                )}
                {reconnect ? "Outlookを再同期" : "Microsoftアカウントを連携"}
            </Button>
            {note && <p className="text-sm text-muted-foreground">{note}</p>}
        </div>
    );
}
