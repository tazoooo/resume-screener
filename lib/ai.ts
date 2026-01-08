import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
    console.warn("Missing GOOGLE_GENERATIVE_AI_API_KEY in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    // @ts-ignore - googleSearch is returned in the API but types might be missing in this version
    tools: [{ googleSearch: {} }],
    generationConfig: { responseMimeType: "application/json" }
});

export async function screenCandidate(jobData: any, candidateText: string) {
    const prompt = `
    You are an expert HR AI Recruiter. Your task is to screen a candidate's resume against a job description.
    
    JOB TITLE: ${jobData.title}
    JOB DESCRIPTION: ${jobData.description}
    CRITERIA (MUST/WANT/NG): ${JSON.stringify(jobData.criteria)}
    
    CANDIDATE RESUME TEXT:
    ${candidateText}
    
    INSTRUCTIONS:
    1. EXTRACT the candidate's High School name from the resume.
    2. USE GOOGLE SEARCH to find the "deviation score" (偏差値) of that high school. Prefer data from "minkou.jp" (みんなの高校情報).
    3. Check MUST requirements matches.
       - Specifically, if there is a criteria about "deviation score" (e.g. 50以上), compare the found score.
       - If the school's deviation score is lower than the criteria, mark as "Reject".
    4. Check NG requirements.
    5. Evaluate WANT requirements.
    6. Provide a "rationale" in JAPANESE (日本語).
       - Explicitly mention the High School name and the found deviation score (e.g., "〇〇高校（偏差値: XX）").
       - Cite the source if possible.
    7. Output JSON format.
    
    OUTPUT SCHEMA:
    {
      "result": "Pass" | "Review" | "Reject",
      "score": number (0-100),
      "rationale": "Markdown string (in Japanese)",
      "must_check": { "requirement": "status (Met/Missing/Unclear)" },
      "risk_flags": ["string"]
    }
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        console.log("Raw AI Response:", text);

        // 1. Try to find a JSON code block first
        const match = text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (match) {
            return JSON.parse(match[1]);
        }

        // 2. Fallback: Find the first '{' and extract the balanced object
        const start = text.indexOf('{');
        if (start !== -1) {
            let balance = 0;
            let end = -1;
            for (let i = start; i < text.length; i++) {
                if (text[i] === '{') balance++;
                else if (text[i] === '}') {
                    balance--;
                    if (balance === 0) {
                        end = i;
                        break;
                    }
                }
            }

            if (end !== -1) {
                const jsonStr = text.substring(start, end + 1);
                return JSON.parse(jsonStr);
            }
        }

        throw new Error("Could not extract JSON from response");
    } catch (error) {
        console.error("AI Screening Error:", error);
        return { result: "Hold", score: 0, rationale: "AI Error: 判定に失敗しました。ログを確認してください。" };
    }
}
