import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">AI履歴書選考ツール</h1>
      <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
        Google Gemini AIを使用して、履歴書を募集要項と自動で照らし合わせます。
        PDFをアップロードして、即座にフィードバックを受け取れます。
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Link href="/jobs" className="block">
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6" />
                求人管理
              </CardTitle>
              <CardDescription>募集ポジションと選考基準を設定します。</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full">求人一覧を見る</Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/candidates" className="block">
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                候補者管理
              </CardTitle>
              <CardDescription>履歴書をアップロードして選考結果を確認します。</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full">候補者一覧を見る</Button>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
