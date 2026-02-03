
import { GoogleGenAI, Type } from "@google/genai";
import { Profile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getIcebreaker = async (myProfile: Profile, targetProfile: Profile): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        You are a dating coach wingman. 
        My profile: ${JSON.stringify(myProfile)}
        Target's profile: ${JSON.stringify(targetProfile)}
        
        Generate 3 witty, short, and engaging icebreaker messages I could send to them based on our shared interests or something unique in their bio. 
        Return them as a single string separated by newlines.
      `,
    });
    return response.text || "Hey! I really liked your profile. How's your day going?";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Hey! I really liked your profile. How's your day going?";
  }
};

export const getProfileAdvice = async (profile: Profile): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Analyze this dating profile bio and interests:
        Bio: ${profile.bio}
        Interests: ${profile.interests.join(', ')}
        
        Provide constructive, friendly advice on how to make it more appealing or what kind of photos might complement it.
        Keep it concise.
      `,
    });
    return response.text || "Your profile looks great! Maybe add more specifics about your hobbies.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Could not get advice at this time.";
  }
};

export const getCompatibilityScore = async (p1: Profile, p2: Profile): Promise<{ score: number, reason: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Compare these two profiles for a dating app:
        Profile 1: ${JSON.stringify(p1)}
        Profile 2: ${JSON.stringify(p2)}
        
        Provide a compatibility score (0-100) and a short reason why they would or wouldn't match.
        Format the response as JSON.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            reason: { type: Type.STRING }
          },
          required: ["score", "reason"]
        }
      }
    });
    
    return JSON.parse(response.text || '{"score": 75, "reason": "You both seem active!"}');
  } catch (error) {
    return { score: 70, reason: "You both have interesting backgrounds!" };
  }
};
