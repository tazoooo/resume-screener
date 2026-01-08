
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const mockJob = {
    title: "Test Job",
    description: "Test Description",
    criteria: { must: ["Degree"], want: [], ng: [] }
};

const mockText = "I have a degree from GitHub High School.";

async function main() {
    // Dynamic import to ensure env is loaded first
    const { screenCandidate } = await import("./lib/ai");

    console.log("Testing AI Screening...");
    try {
        const result = await screenCandidate(mockJob, mockText);
        console.log("Result:", result);
    } catch (e) {
        console.error("Critical Error:", e);
    }
}
// Remove the direct call and let main run
main();
