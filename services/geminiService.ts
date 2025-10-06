import { GoogleGenAI, Type } from "@google/genai";
import { DailyMarket, ExtremeEvent, User, PlacedBet, Bet, WeatherEvent, Market, Selection } from '../types';

const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});

// Type guard to differentiate bet types
function isPlacedBet(bet: Bet | PlacedBet): bet is PlacedBet {
    return (bet as PlacedBet).betType === 'Combined';
}

const marketSuggestionSchema = {
    type: Type.OBJECT,
    properties: {
        event: { type: Type.STRING },
        location: { type: Type.STRING },
        icon: { type: Type.STRING, enum: ['sun', 'rain', 'wind', 'temperature', 'storm', 'snow', 'cyclone'] },
        betType: { type: Type.STRING, enum: ['OverUnder', 'ExactValue'] },
        unit: { type: Type.STRING, enum: ['°C', 'km/h', 'mm'] },
        options: {
            type: Type.OBJECT,
            properties: {
                A: {
                    type: Type.OBJECT,
                    properties: { name: { type: Type.STRING }, odds: { type: Type.NUMBER } },
                    required: ["name", "odds"]
                },
                B: {
                    type: Type.OBJECT,
                    properties: { name: { type: Type.STRING }, odds: { type: Type.NUMBER } },
                    required: ["name", "odds"]
                },
            },
        },
        range: {
            type: Type.OBJECT,
            properties: {
                min: { type: Type.NUMBER },
                max: { type: Type.NUMBER },
                step: { type: Type.NUMBER },
            },
        }
    },
    required: ["event", "location", "icon", "betType", "unit"]
};

const marketListSchema = {
    type: Type.ARRAY,
    items: marketSuggestionSchema,
};

const weatherEventSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        location: { type: Type.STRING },
        date: { type: Type.STRING },
        markets: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    selections: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                name: { type: Type.STRING },
                                odds: { type: Type.NUMBER },
                            },
                            required: ["id", "name", "odds"],
                        },
                    },
                },
                required: ["id", "name", "selections"],
            },
        },
    },
    required: ["name", "location", "date", "markets"],
};

export const generateEventHeaderAndInitialMarkets = async (initialMarket: DailyMarket): Promise<WeatherEvent> => {
    const prompt = `Based on this real weather betting market: { event: "${initialMarket.event}", location: "${initialMarket.location}", date: "${initialMarket.date}" }, please act as an expert bookmaker. 
    Generate the main event details and ONLY 2 to 3 essential markets (like Maximum/Minimum Temperature).
    The event should have a name like "Weather in ${initialMarket.location}".
    Each market must have a unique ID, a name, and 2-4 selections with unique IDs, names, and plausible odds.
    This initial response needs to be generated VERY QUICKLY.
    Return a single JSON object that strictly follows the provided schema.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: weatherEventSchema,
            thinkingConfig: { thinkingBudget: 0 } // Disable thinking for speed
        },
    });
    
    return JSON.parse(response.text) as WeatherEvent;
};

const additionalMarketsSchema = {
    type: Type.ARRAY,
    items: weatherEventSchema.properties.markets.items,
};

export const generateAdditionalMarkets = async (event: WeatherEvent): Promise<Market[]> => {
     const existingMarketNames = event.markets.map(m => m.name).join(', ');
     const prompt = `You are continuing to build a betting event.
     The event is: "${event.name}" in ${event.location} on ${event.date}.
     The following markets already exist: ${existingMarketNames}.
     Now, generate a list of 6 to 8 NEW and DIVERSE additional markets. Focus on different categories like Precipitation, Wind, and specific Scenarios (e.g., 'Will there be hail?').
     DO NOT repeat the existing markets. Each new market must have a unique ID, a name, and 2-4 selections with unique IDs, names, and plausible odds.
     Return ONLY a JSON array of the new market objects.`;
 
     const response = await ai.models.generateContent({
         model: "gemini-2.5-flash",
         contents: prompt,
         config: {
             responseMimeType: "application/json",
             responseSchema: additionalMarketsSchema,
         },
     });
     
     return JSON.parse(response.text) as Market[];
 };

const updatedOddsSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING },
            odds: { type: Type.NUMBER },
        },
        required: ["id", "odds"],
    },
};

export const getUpdatedOdds = async (market: Market): Promise<Pick<Selection, 'id' | 'odds'>[]> => {
    const prompt = `You are an odds adjustment algorithm for a busy betting site.
    For the market "${market.name}", you need to simulate a plausible shift in betting patterns.
    The current selections and odds are: ${JSON.stringify(market.selections.map(s => ({ name: s.name, odds: s.odds })))}.

    Simulate a plausible scenario (e.g., a surge of bets on one option due to a late weather model update, or market balancing) and return the NEW odds for all selections.
    - The changes should be subtle (e.g., from 1.85 to 1.80 or 1.95).
    - You MUST return an update for every selection ID provided in the original market.
    - The new odds must maintain a plausible bookmaker's margin.
    
    Return ONLY a JSON array of objects, where each object contains the selection 'id' and its new 'odds'.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: updatedOddsSchema,
        },
    });
    
    return JSON.parse(response.text) as Pick<Selection, 'id' | 'odds'>[];
};


export const suggestMarket = async (): Promise<Partial<DailyMarket>> => {
    try {
        const prompt = `Suggest one fictional but plausible daily weather betting market for a major world city for tomorrow. 
        Randomly choose a 'betType': either 'OverUnder' or 'ExactValue'.
        - If 'OverUnder', provide two mutually exclusive options (A and B) with calculated odds that reflect their probability. The sum of probabilities (1/odds_A + 1/odds_B) should be slightly over 1.0 for a bookmaker's margin.
        - If 'ExactValue', provide a plausible 'range' with min, max, and step values for the user to bet on. Do NOT provide 'options'.
        - Provide a relevant 'unit' ('°C', 'km/h', 'mm') and 'icon'.
        Return a valid JSON object matching the schema.`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: marketSuggestionSchema,
            },
        });

        const jsonText = response.text;
        return JSON.parse(jsonText) as Partial<DailyMarket>;
    } catch (error) {
        console.error("Error suggesting market:", error);
        throw new Error("Failed to get market suggestion from Gemini API.");
    }
};

const oddsSchema = {
    type: Type.OBJECT,
    properties: {
        odds: { type: Type.NUMBER }
    },
    required: ["odds"]
};

export const calculateDynamicOdds = async (market: DailyMarket, value: number): Promise<{odds: number}> => {
    if (market.betType !== 'ExactValue') {
        throw new Error("Dynamic odds can only be calculated for 'ExactValue' markets.");
    }
    try {
        const prompt = `As a weather betting oddsmaker, calculate the odds for a specific outcome in the following market:
- Market: "${market.event}" in ${market.location}.
- The user wants to bet that the final value will be exactly ${value}${market.unit}.
- The possible range is from ${market.range.min}${market.unit} to ${market.range.max}${market.unit}.

Considering typical weather patterns for that location, provide fair but profitable odds. A very likely outcome should have low odds (e.g., 2.0-5.0), while a very unlikely outcome should have high odds (e.g., 50.0-100.0).
Return a JSON object with just the 'odds' field.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: oddsSchema,
            }
        });

        const jsonText = response.text;
        const result = JSON.parse(jsonText) as { odds: number };
        // Basic validation
        if (result.odds < 1.01) {
            result.odds = 1.01
        }
        return result

    } catch (error) {
        console.error("Error calculating dynamic odds:", error);
        // Fallback to a simple formula if API fails
        return { odds: 10.0 + Math.random() * 5 };
    }
};


export const suggestStormMarket = async (): Promise<Partial<DailyMarket>> => {
    try {
        const prompt = `Suggest a single, fictional but plausible 'OverUnder' betting market for a new tropical storm or cyclone.
        - Give it a compelling event name (e.g., 'Tropical Storm Alpha's Path').
        - Provide a relevant major city or region as the location.
        - Create two mutually exclusive betting options with plausible odds (e.g., 'Makes landfall in Florida' vs. 'Stays at sea'). The sum of probabilities should be slightly over 1.0.
        - Assign an appropriate 'icon' ('cyclone' or 'storm') and 'unit' (e.g., 'km/h' if it's about wind speed).
        - Set betType to 'OverUnder'.`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: marketSuggestionSchema,
            },
        });

        const jsonText = response.text;
        return JSON.parse(jsonText) as Partial<DailyMarket>;
    } catch (error) {
        console.error("Error suggesting storm market:", error);
        throw new Error("Failed to get storm market suggestion from Gemini API.");
    }
};

const extremeEventSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            event: { type: Type.STRING, description: "Name of the extreme weather event (e.g., 'Major Heatwave', 'Tropical Cyclone')." },
            location: { type: Type.STRING, description: "A major city or region relevant to the overall region provided." },
            projected_date: { type: Type.STRING, description: "A projected month or date range for the event (e.g., 'Mid-August 2024')." },
            probability: { type: Type.NUMBER, description: "The estimated probability of the event occurring, as a decimal between 0 and 1." },
            details: { type: Type.STRING, description: "A brief, one-sentence description of the potential event and its impact." },
            icon: { type: Type.STRING, enum: ['cyclone', 'tsunami', 'storm', 'sun'], description: "An icon that best represents the event. 'sun' can be used for heatwaves." },
        },
        required: ['event', 'location', 'projected_date', 'probability', 'details', 'icon']
    },
};

// A helper to generate plausible, but random, coordinates for a given region.
const getMockCoordinatesForRegion = (region: string) => {
    const regionCoords: Record<string, { lat: [number, number], lng: [number, number] }> = {
        'Global': { lat: [-50, 50], lng: [-160, 160] },
        'North America': { lat: [25, 60], lng: [-120, -70] },
        'South America': { lat: [-40, 10], lng: [-70, -40] },
        'Europe': { lat: [40, 60], lng: [0, 30] },
        'Africa': { lat: [-30, 30], lng: [-10, 40] },
        'Asia': { lat: [10, 50], lng: [70, 120] },
        'Oceania': { lat: [-40, -10], lng: [120, 170] },
        'Antarctica': { lat: [-80, -65], lng: [-180, 180] },
    };
    const coords = regionCoords[region] || regionCoords['Global'];
    const lat = Math.random() * (coords.lat[1] - coords.lat[0]) + coords.lat[0];
    const lng = Math.random() * (coords.lng[1] - coords.lng[0]) + coords.lng[0];
    return { lat, lng };
}


export const generateExtremeEvents = async (region: string): Promise<ExtremeEvent[]> => {
    try {
        const prompt = `Generate a list of 3 fictional but plausible upcoming extreme weather events for the region: ${region}. These should be long-range forecasts for the coming months. For each event, provide its name, location (a major city or area within the region), a projected date range, an estimated probability between 0 and 1, a brief one-sentence detail, and a suitable icon.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: extremeEventSchema,
            },
        });

        const jsonText = response.text;
        const events = JSON.parse(jsonText) as Omit<ExtremeEvent, 'id' | 'lat' | 'lng'>[];

        return events.map((event, index) => ({
            ...event,
            id: `extreme-${region.toLowerCase().replace(/\s/g, '')}-${index}-${Date.now()}`,
            ...getMockCoordinatesForRegion(region),
        }));
    } catch (error) {
        console.error("Error generating extreme events:", error);
        throw new Error("Failed to get extreme events from Gemini API.");
    }
};

export const generateLiveMarkets = async (): Promise<DailyMarket[]> => {
    try {
        const prompt = `Generate a list of 4 fictional but plausible live weather betting markets for major world cities.
        - These are for micro-events happening in the next hour.
        - The event description should be a question, e.g., "Rain in London in the next 30 mins?".
        - The 'date' field must be "Live".
        - The 'betType' must be 'OverUnder'.
        - Options should be simple 'Yes' vs 'No' with plausible odds reflecting a bookmaker's margin.
        - Assign an appropriate icon.
        - Return a valid JSON array matching the schema.`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: marketListSchema,
            },
        });

        const jsonText = response.text;
        const markets = JSON.parse(jsonText) as Partial<DailyMarket>[];
        // Augment with missing fields
        return markets.map((market, i) => ({
            ...market,
            id: `live-${i}-${Date.now()}`,
            status: 'Active',
            lat: Math.random() * 180 - 90, // mock coords
            lng: Math.random() * 360 - 180,
        })) as DailyMarket[];
    } catch (error) {
        console.error("Error generating live markets:", error);
        throw new Error("Failed to get live markets from Gemini API.");
    }
};

export const generateHeadToHeadMarkets = async (): Promise<DailyMarket[]> => {
    try {
        const prompt = `Generate a list of 4 fictional but plausible head-to-head weather betting markets for tomorrow.
        - Each market pits two major world cities against each other on a specific metric (e.g., 'Highest Temperature', 'Most Rainfall').
        - The 'event' field should describe the matchup, e.g., "Head-to-Head: Highest Temperature".
        - The 'location' field should be formatted as "City A vs. City B".
        - The 'date' field should be for tomorrow's date (YYYY-MM-DD).
        - The 'betType' must be 'OverUnder'.
        - The 'options' should be the two city names, with plausible odds reflecting their likelihood and a bookmaker's margin.
        - Assign an appropriate icon for the weather metric.
        - Return a valid JSON array matching the schema.`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: marketListSchema,
            },
        });

        const jsonText = response.text;
        const markets = JSON.parse(jsonText) as Partial<DailyMarket>[];
         // Augment with missing fields
         const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
         return markets.map((market, i) => ({
             ...market,
             id: `h2h-${i}-${Date.now()}`,
             date: market.date || tomorrow, // Gemini might not provide date, so fallback
             status: 'Active',
             lat: Math.random() * 180 - 90, // mock coords
             lng: Math.random() * 360 - 180,
         })) as DailyMarket[];
    } catch (error) {
        console.error("Error generating head-to-head markets:", error);
        throw new Error("Failed to get head-to-head markets from Gemini API.");
    }
};

export const getMarketAnalysis = async (market: DailyMarket): Promise<string> => {
    const marketDetails = market.betType === 'OverUnder' 
        ? `with odds "${market.options.A.name}" at ${market.options.A.odds} and "${market.options.B.name}" at ${market.options.B.odds}`
        : `where users can bet on an exact value between ${market.range.min} and ${market.range.max}${market.unit}`;

    try {
        const prompt = `You are a weather betting analyst. For the market "${market.event}" in "${market.location}" ${marketDetails}, provide a short, insightful analysis (2-3 sentences) for a bettor. Explain potential factors influencing the outcome in a plausible, engaging way. Start your response with 'Gemini Insight:'.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error getting market analysis:", error);
        throw new Error("Failed to get market analysis from Gemini API.");
    }
};

const recommendationsSchema = {
    type: Type.ARRAY,
    items: marketSuggestionSchema,
};

export const getRecommendedMarkets = async (user: User, allMarkets: DailyMarket[]): Promise<DailyMarket[]> => {
    if (allMarkets.length === 0) return [];
    
    // Filter out markets the user has already bet on
    const userBetMarketIds = new Set(user.bets.filter(bet => !isPlacedBet(bet)).map(b => (b as Bet).market.id));
    const availableMarkets = allMarkets.filter(market => !userBetMarketIds.has(market.id) && market.status === 'Active');

    if (availableMarkets.length === 0) return [];

    try {
        const historySummary = user.bets.length > 0
            ? `The user has previously bet on events like: ${[...new Set(user.bets.map(b => {
                if (isPlacedBet(b)) {
                    return b.selections.length > 0 ? `${b.selections[0].eventName} in ${b.selections[0].eventLocation.split(',')[0]}` : '';
                }
                return `${b.market.event} in ${b.market.location.split(',')[0]}`;
              }))].slice(0, 5).join(', ')}.`
            : "The user has no betting history.";

        const prompt = `Based on the user's betting history, recommend up to 3 relevant markets from the provided available markets list.
        ${historySummary}
        Available markets: ${JSON.stringify(availableMarkets.slice(0, 20).map(({id, event, location}) => ({id, event, location})))}
        
        Select up to 3 markets from the available list that are most relevant to the user's past betting patterns. If the user has no history, pick 3 diverse and interesting markets.
        Return a JSON array containing ONLY the full market objects of your selections, which must match exactly one of the items from the provided available markets.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: recommendationsSchema,
            },
        });
        
        const jsonText = response.text;
        // The API might return markets that are not strictly in the list, so we'll validate.
        const recommended = JSON.parse(jsonText) as DailyMarket[];
        const validRecommended = recommended.filter(rec => availableMarkets.some(avail => avail.id === rec.id));

        return validRecommended.length > 0 ? validRecommended : availableMarkets.slice(0, 3);

    } catch (error) {
        console.error("Error getting recommended markets:", error);
        // Fallback to simple filtering if AI fails
        return availableMarkets.slice(0, 3);
    }
};