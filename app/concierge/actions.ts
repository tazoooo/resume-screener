"use server";

import { revalidatePath } from "next/cache";
import {
    syncOutlook,
    extractAllPending,
    extractFromEvent,
    approveCandidate,
    dismissCandidate,
    holdCandidate,
    reopenCandidate,
    editCandidate,
    setTaskStatus,
} from "@/lib/concierge/service";

function revalidateAll() {
    revalidatePath("/concierge");
    revalidatePath("/concierge/inbox");
    revalidatePath("/concierge/briefing");
}

/** Microsoftアカウント連携（モック）。 */
export async function connectMicrosoft() {
    const result = await syncOutlook();
    revalidateAll();
    return result;
}

/** 未抽出のイベントすべてからAIタスク抽出。 */
export async function extractAll() {
    const result = await extractAllPending();
    revalidateAll();
    return result;
}

export async function extractOne(formData: FormData) {
    const id = Number(formData.get("eventId"));
    if (id) await extractFromEvent(id);
    revalidateAll();
}

export async function approveTask(formData: FormData) {
    const id = Number(formData.get("id"));
    if (id) await approveCandidate(id);
    revalidateAll();
}

export async function dismissTask(formData: FormData) {
    const id = Number(formData.get("id"));
    if (id) await dismissCandidate(id);
    revalidateAll();
}

export async function holdTask(formData: FormData) {
    const id = Number(formData.get("id"));
    if (id) await holdCandidate(id);
    revalidateAll();
}

export async function reopenTask(formData: FormData) {
    const id = Number(formData.get("id"));
    if (id) await reopenCandidate(id);
    revalidateAll();
}

export async function saveCandidateEdit(formData: FormData) {
    const id = Number(formData.get("id"));
    if (id) {
        await editCandidate(id, {
            taskTitle: (formData.get("taskTitle") as string) ?? undefined,
            description: (formData.get("description") as string) ?? undefined,
            dueDate: (formData.get("dueDate") as string) ?? undefined,
        });
    }
    revalidateAll();
}

export async function setTaskStatusAction(id: number, status: string) {
    if (id && status) await setTaskStatus(id, status);
    revalidateAll();
    revalidatePath(`/concierge/tasks/${id}`);
}
