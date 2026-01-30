
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini AI with API key from environment variable directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface GameStatus {
  score: number;
  lives: number;
  event: 'START' | 'POWER_UP' | 'GHOST_EATEN' | 'DIED' | 'WIN' | 'NEAR_MISS';
  ghostsEatenCount?: number;
}

export const getGeminiCommentary = async (status: GameStatus): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an arcade game commentator for Gemini-Man. 
      Briefly comment on the current game state in a retro, energetic style.
      Context: Event is ${status.event}, Score is ${status.score}, Lives remaining: ${status.lives}.
      Keep it under 15 words. Use caps for emphasis sparingly.`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    // Access the .text property directly.
    return response.text || "LETS GO! DON'T GET CAUGHT!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "EAT THEM ALL! WATCH OUT!";
  }
};

export const getGeminiStrategy = async (score: number, level: number): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a single pro-tip for Pac-Man players based on a score of ${score} and level ${level}. 
      Mention ghost behavior patterns or power pellet strategy. Keep it concise.`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    // Access the .text property directly.
    return response.text || "Avoid corners when ghosts are near!";
  } catch (error) {
    return "Try to group ghosts before eating a power pellet!";
  }
};
