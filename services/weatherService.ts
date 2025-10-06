
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});

const outcomeSchema = {
    type: Type.OBJECT,
    properties: {
        actualResult: { type: Type.STRING, description: "A plausible, specific weather value that justifies the outcome, including units (e.g., '21.5°C', '0.2mm', '18 km/h')." },
    },
    required: ["actualResult"]
};

/**
 * Uses Gemini to determine a plausible weather outcome for a given market.
 * @param marketInfo An object containing the event, location, and date.
 * @returns An object containing the simulated weather result string.
 */
export const getWeatherOutcome = async (marketInfo: { event: string, location: string, date: string }): Promise<{ actualResult: string }> => {
    try {
        const prompt = `You are an AI simulating the Frogcast weather API, known for precise probabilistic forecasts. Your task is to provide a final, plausible weather result for a past event.
For the betting market:
- Event: "${marketInfo.event}"
- Location: "${marketInfo.location}"
- Date: ${marketInfo.date}

Based on your sophisticated climate models for that location and time of year, what was the most likely final result?

Your response MUST be a JSON object containing only the 'actualResult' field. The value should be a specific string including units (e.g., '21.5°C', '0.2mm', '18 km/h', 'No snowfall').`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: outcomeSchema,
            }
        });

        const result = JSON.parse(response.text) as { actualResult: string };
        return result;

    } catch (error) {
        console.error("Error getting weather outcome from Gemini:", error);
        
        // Fallback in case of API error
        return { actualResult: "Result could not be determined." };
    }
};
