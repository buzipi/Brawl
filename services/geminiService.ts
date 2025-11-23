import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

try {
  if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
} catch (error) {
  console.error("Failed to initialize GoogleGenAI", error);
}

export const getAnnouncerCommentary = async (event: string, context: string): Promise<string> => {
  if (!ai) return "";

  try {
    const prompt = `
      You are an ultra-hyped, high-energy esports announcer for a fast-paced shooter game called "Brawl AI".
      
      Event: ${event}
      Context: ${context}
      
      Task: Give a VERY short, punchy, excited 3-7 word reaction to shout at the player. Use caps for emphasis.
      Examples: 
      - "DOUBLE KILL! UNSTOPPABLE!"
      - "BLUE TEAM TAKES THE LEAD!"
      - "OOOF! THAT HAD TO HURT!"
      - "GEM SECURED! PROTECT IT!"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }, // Speed is priority
      }
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "";
  }
};

export const generateBotName = async (): Promise<string> => {
    if (!ai) return "Bot-" + Math.floor(Math.random() * 1000);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Generate a funny, 1-word gamer tag for a bot. No explanations.",
        });
        return response.text?.trim() || "Bot";
    } catch (e) {
        return "Bot";
    }
}