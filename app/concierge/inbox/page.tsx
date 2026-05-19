import Link from "next/link";
import { ensureSchema, getSourceEvents, getCandidates } from "@/lib/concierge/service";
import { Card } from "@/components/ui/card";
import { ExtractButton } from "@/components/concierge/extract-button";
import { InboxCard } from "@/components/concierge/inbox-card";
import { SourceTypeBadge } from "@/components/concierge/badges";
import { formatDateTime } from "@/lib/concierge/format";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
    let events;
    let candidates;
    let holds;
    let dbError = "";
    try {
        await ensureSchema();
        events = await getSourceEvents();
        candidates = await getCandidates("candidate");
        holds = await getCandidates("hold");
    } catch (e) {
        dbError = e instanceof Error ? e.message : String(e);
    }

    if (dbError) {
        return (
            <div className="container mx-auto py-10 px-4">
                <h1 className="text-2xl font-bold mb-2">Inbox</h1>
                <Card className="p-6 border-red-200 bg-red-50">
                    <p className="font-medium text-red-700">データベースに接続できません</p>
                    <p className="text-sm text-red-600 mt-1">{dbError}</p>
                </Card>
            </div>
        );
    }

    const allEvents = events!;
    const pending = allEvents.filter((e) => !e.extractedAt);

    if (allEvents.length === 0) {
        return (
            <div className="container mx-auto py-16 px-4 text-center space-y-3">
                <h1 className="text-2xl font-bold">Inbox</h1>
                <p className="text-muted-foreground">
                    まだメール・予定が取り込まれていません。
                </p>
                <Link href="/concierge" className="text-indigo-600 hover:underline">
                    ダッシュボードからMicrosoftアカウントを連携する
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-3xl">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
                <h1 className="text-2xl font-bold">Inbox</h1>
                <ExtractButton pendingCount={pending.length} />
            </div>
            <p className="text-sm text-muted-foreground mb-6">
                AIが抽出したタスク候補を承認・編集・却下・保留できます。
            </p>

            {/* 取り込み済みの元情報 */}
            <Card className="p-5 gap-3 mb-6">
                <h2 className="font-semibold">取り込み済みのメール・予定（{allEvents.length}件）</h2>
                <div className="space-y-1">
                    {allEvents.map((e) => (
                        <div
                            key={e.id}
                            className="flex items-center gap-2 text-sm py-1.5 border-b last:border-0"
                        >
                            <SourceTypeBadge type={e.sourceType} />
                            <span className="truncate flex-1">{e.title}</span>
                            <span className="text-xs text-muted-foreground shrink-0">
                                {formatDateTime(e.eventTime)}
                            </span>
                            <span
                                className={
                                    "text-xs shrink-0 " +
                                    (e.extractedAt ? "text-green-600" : "text-amber-600")
                                }
                            >
                                {e.extractedAt ? "抽出済" : "未抽出"}
                            </span>
                        </div>
                    ))}
                </div>
            </Card>

            {/* タスク候補 */}
            <h2 className="font-semibold mb-3">承認待ちのタスク候補（{candidates!.length}件）</h2>
            {candidates!.length === 0 ? (
                <p className="text-sm text-muted-foreground mb-6">
                    承認待ちの候補はありません。
                    {pending.length > 0 && "「AIでタスク抽出」を実行してください。"}
                </p>
            ) : (
                <div className="space-y-4 mb-8">
                    {candidates!.map((c) => (
                        <InboxCard key={c.id} candidate={c} />
                    ))}
                </div>
            )}

            {holds!.length > 0 && (
                <>
                    <h2 className="font-semibold mb-3">保留中（{holds!.length}件）</h2>
                    <div className="space-y-4">
                        {holds!.map((c) => (
                            <InboxCard key={c.id} candidate={c} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
