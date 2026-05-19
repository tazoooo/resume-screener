/**
 * Outlook連携のモックデータ。
 * 実環境ではMicrosoft Graph APIから取得する source_events を、
 * デモ用に再現したもの（要件定義書 §6 source_events）。
 *
 * 日時は「連携を実行した時点」を基準に相対的に生成する。
 */

export type MockSourceEvent = {
    sourceType: "email" | "calendar" | "memo" | "transcript";
    externalId: string;
    title: string;
    body: string;
    sender: string;
    participants: string[];
    /** 連携時点(now)からのオフセット時間。負=過去 / 正=未来 */
    eventOffsetHours: number;
};

export const MOCK_SOURCE_EVENTS: MockSourceEvent[] = [
    {
        sourceType: "email",
        externalId: "AAMkmail-001",
        title: "【至急】来期予算案レビューのお願い",
        body:
            "お疲れさまです、CEOの田中です。\n" +
            "添付の来期予算案について、本日中にコメントをいただけますでしょうか。\n" +
            "明日の経営会議で使用するため、本日17時までにご返信をお願いします。\n" +
            "特に販管費の見立てについて意見をください。",
        sender: "田中CEO <tanaka@example.co.jp>",
        participants: ["田中CEO", "あなた"],
        eventOffsetHours: -3,
    },
    {
        sourceType: "email",
        externalId: "AAMkmail-002",
        title: "業務委託契約書（修正版）のご確認依頼",
        body:
            "B社の山本です。いつもお世話になっております。\n" +
            "先日ご指摘いただいた条項を反映した契約書の修正版をお送りします。\n" +
            "明日中に最終確認のうえ、問題なければ署名手続きに進ませてください。",
        sender: "山本様(B社) <yamamoto@b-corp.example.com>",
        participants: ["山本様(B社)", "あなた"],
        eventOffsetHours: -20,
    },
    {
        sourceType: "calendar",
        externalId: "AAMkcal-101",
        title: "A社 新規提案MTG",
        body:
            "A社への新規提案の打ち合わせ。\n" +
            "提案資料の最終版と見積もりを事前に準備しておくこと。\n" +
            "場所: A社 本社 / 担当: 先方 購買部 3名",
        sender: "あなた",
        participants: ["あなた", "営業部 高橋", "A社 購買部"],
        eventOffsetHours: 22,
    },
    {
        sourceType: "email",
        externalId: "AAMkmail-003",
        title: "一次面接の日程調整について（採用候補 佐藤様）",
        body:
            "人事の中村です。エンジニア採用候補の佐藤様より、\n" +
            "一次面接の希望日程の連絡がありました。今週中に面接官アサインと\n" +
            "日程確定をお願いできますでしょうか。候補日: 5/22, 5/23 午後。",
        sender: "中村(人事) <nakamura@example.co.jp>",
        participants: ["中村(人事)", "あなた"],
        eventOffsetHours: -28,
    },
    {
        sourceType: "email",
        externalId: "AAMkmail-004",
        title: "4月分 請求書の支払い承認のお願い",
        body:
            "経理部です。4月分の外注費請求書3件について、支払い承認をお願いします。\n" +
            "締めの都合上、明後日までにワークフロー上で承認操作をお願いします。\n" +
            "合計金額: 1,240,000円",
        sender: "経理部 <keiri@example.co.jp>",
        participants: ["経理部", "あなた"],
        eventOffsetHours: -26,
    },
    {
        sourceType: "email",
        externalId: "AAMkmail-005",
        title: "御見積もりのご依頼（C社 ウェブ制作の件）",
        body:
            "C社の小林と申します。先日お問い合わせした件で、\n" +
            "ウェブサイト制作のお見積もりをいただけますでしょうか。\n" +
            "社内検討を進めたいので、ご返信をお待ちしております。",
        sender: "小林様(C社) <kobayashi@c-inc.example.com>",
        participants: ["小林様(C社)", "あなた"],
        eventOffsetHours: -76,
    },
    {
        sourceType: "email",
        externalId: "AAMkmail-006",
        title: "先週の定例MTG 議事録の共有",
        body:
            "鈴木です。先週の週次定例の議事録を共有します。\n" +
            "特にアクションはありませんが、目を通しておいてください。",
        sender: "鈴木 <suzuki@example.co.jp>",
        participants: ["鈴木", "あなた"],
        eventOffsetHours: -30,
    },
    {
        sourceType: "memo",
        externalId: "MEMO-201",
        title: "メモ: 全社会議スライド",
        body: "来週の全社会議用スライドのドラフトを作る。去年のテンプレを流用する。",
        sender: "あなた",
        participants: ["あなた"],
        eventOffsetHours: -5,
    },
    {
        sourceType: "transcript",
        externalId: "TRANS-301",
        title: "A社キックオフ 打ち合わせ 議事録",
        body:
            "A社キックオフMTGの文字起こし。\n" +
            "・先方より、来月初週までに体制図を共有してほしいと依頼あり。\n" +
            "・あなたが次回までにスケジュール案を作成して送付することで合意。\n" +
            "・見積もりは別途、購買部宛に提出。",
        sender: "会議文字起こし",
        participants: ["あなた", "A社 担当", "営業部 高橋"],
        eventOffsetHours: -48,
    },
];
