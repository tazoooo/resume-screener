import { getJobs } from "@/app/actions";
import UploadForm from "./form";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
    const jobs = await getJobs();

    return (
        <div className="container mx-auto py-8">
            <UploadForm jobs={jobs} />
        </div>
    );
}
