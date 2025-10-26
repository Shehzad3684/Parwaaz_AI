import { GoogleGenAI, Type, Modality } from "@google/genai";
import { CallData, Scenario, TranscriptionEntry } from "../types";

const SUPERVISOR_PROMPT = `
You are Field Training Officer (FTO) Miller, an experienced and respected 911 dispatch trainer. 
Your job is to provide constructive feedback to a rookie dispatcher based on a call transcript and the actions they took.
Your tone should be firm, fair, and educational. Acknowledge successes but be clear about areas that need improvement. The goal is to build a competent dispatcher, not to break their spirit.
Evaluate the following, providing both a positive and a negative point if applicable:
1.  **Response Time**: Did they get the critical information (address, nature of emergency) promptly? Were there any delays?
2.  **Dispatch Accuracy**: Did they send the right units? Was their choice of ALS vs BLS correct for the situation?
3.  **Tone Management**: How was their tone? Did it help or hinder the call? Did they remain professional?
4.  **Protocol Adherence**: Did they follow the "Six W's" (Who, What, Where, When, Why, Weapons)? Did they miss any steps?
5.  **Overall Critique**: A final summary that balances positive reinforcement with actionable advice for the next call.

Based on the provided scenario and transcript, return a JSON object with your analysis.
`;

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        score: {
            type: Type.INTEGER,
            description: "A score from 0 to 100 representing the dispatcher's performance. Be fair. A decent performance should be 70-85. A perfect performance is 100."
        },
        responseTime: {
            type: Type.STRING,
            description: "Critique of the time taken. Example: 'Good job getting the address early. Next time, try to confirm the apartment number a bit sooner.'"
        },
        dispatchAccuracy: {
            type: Type.STRING,
            description: "Critique of the units dispatched. Example: 'Correctly dispatching ALS for a cardiac call was the right move. Good decision-making.'"
        },
        toneManagement: {
            type: Type.STRING,
            description: "Critique of the dispatcher's tone. Example: 'Your calm tone was effective. However, avoid unprofessional phrases like 'no worries'. Stick to 'I understand.''"
        },
        protocolAdherence: {
            type: Type.STRING,
            description: "Critique of their adherence to protocol. Example: 'You covered all the Six W's, which is great. You just need to work on the flow.'"
        },
        overallCritique: {
            type: Type.STRING,
            description: "A final, encouraging but constructive summary. Example: 'Overall, a solid performance. You made the right calls. Focus on refining your language. You're on the right track.'"
        }
    },
    required: ["score", "responseTime", "dispatchAccuracy", "toneManagement", "protocolAdherence", "overallCritique"]
};

export class GeminiService {
    private ai: GoogleGenAI;

    constructor(apiKey: string) {
        if (!apiKey) {
            throw new Error("API key is missing.");
        }
        this.ai = new GoogleGenAI({ apiKey });
    }

    async analyzeCall(
        transcript: TranscriptionEntry[],
        callData: CallData,
        scenario: Scenario
    ): Promise<any> {
        try {
            const formattedTranscript = transcript.map(t => `${t.speaker.toUpperCase()}: ${t.text}`).join('\n');
            const userPrompt = `
            **Scenario:** ${scenario.title} - ${scenario.systemInstruction}
            **Required Actions:** ${scenario.requiredActions.join(', ')}
            ---
            **Dispatcher Actions:**
            - Address Logged: ${callData.address}
            - Description: ${callData.description}
            - Notes: ${callData.notes}
            - Units Dispatched: ${callData.dispatchedUnits.join(', ') || 'None'}
            ---
            **Call Transcript:**
            ${formattedTranscript}
            `;

            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: userPrompt,
                config: {
                    systemInstruction: SUPERVISOR_PROMPT,
                    responseMimeType: 'application/json',
                    responseSchema: analysisSchema
                }
            });

            const jsonText = response.text.trim();
            return JSON.parse(jsonText);
        } catch (error) {
            console.error("Error analyzing call:", error);
            throw new Error("Failed to get supervisor analysis.");
        }
    }

    async getSupervisorSpeech(text: string): Promise<string | null> {
        if (!text) return null;
        try {
            const response = await this.ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: `Say with a calm, professional, and instructive tone: ${text}` }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Charon' },
                        },
                    },
                },
            });

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (!base64Audio) {
                throw new Error("No audio data received from TTS API.");
            }
            return base64Audio;
        } catch (error) {
            console.error("Error generating supervisor speech:", error);
            return null;
        }
    }
}