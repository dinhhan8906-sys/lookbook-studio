import { GoogleGenAI, Type } from '@google/genai';
import { AnalysisJson } from '../store/useStore';

function getAiClient() {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
}

export interface MarketingContext {
  platform: string;
  audience: string;
  tone: string;
  price: string;
}

export async function analyzeImage(base64Data: string, mimeType: string, context?: MarketingContext): Promise<AnalysisJson> {
  const ai = getAiClient();
  const contextPrompt = context 
    ? `\nContext:\n- Platform Focus: ${context.platform}\n- Target Audience: ${context.audience}\n- Brand Tone: ${context.tone}\n- Price Segment: ${context.price}`
    : '';

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data.split(',')[1] || base64Data, // Remove data URI prefix if present
            mimeType,
          },
        },
        {
          text: `Analyze this image for a fashion/product lookbook.${contextPrompt}\nExtract the product type, style, dominant colors, target audience, marketing angle, visual mood, and provide a brand positioning suggestion.`,
        },
      ],
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          product_type: { type: Type.STRING, description: 'The type of product shown (e.g., dress, sneakers, watch).' },
          style: { type: Type.STRING, description: 'The fashion style (e.g., streetwear, elegant, minimalist).' },
          color: { type: Type.STRING, description: 'Dominant colors in the image.' },
          target_audience: { type: Type.STRING, description: 'The ideal demographic for this product.' },
          marketing_angle: { type: Type.STRING, description: 'The best marketing angle to sell this product.' },
          visual_mood: { type: Type.STRING, description: 'The overall mood or vibe of the image.' },
          brand_positioning_suggestion: { type: Type.STRING, description: 'A suggestion for how to position this brand.' },
        },
        required: ['product_type', 'style', 'color', 'target_audience', 'marketing_angle', 'visual_mood', 'brand_positioning_suggestion'],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error('No response from Gemini');
  return JSON.parse(text) as AnalysisJson;
}

export interface AnglePrompt {
  angle: string;
  prompt: string;
}

export async function generatePrompts(analysis: AnalysisJson, context?: MarketingContext): Promise<AnglePrompt[]> {
  const ai = getAiClient();
  const contextPrompt = context 
    ? `\nMarketing Context:\n- Platform: ${context.platform}\n- Audience: ${context.audience}\n- Tone: ${context.tone}\n- Price: ${context.price}\n`
    : '';

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Based on the following product analysis and marketing context, generate 9 distinct and highly detailed image generation prompts for a professional fashion lookbook photoshoot.
    
Analysis:
${JSON.stringify(analysis, null, 2)}
${contextPrompt}
Requirements:
1. Provide exactly 9 prompts, each representing a different camera angle or shot type (e.g., Full Body, Close-up, Low Angle, High Angle, Over the Shoulder, Detail Shot, Wide Shot, Action Shot, Portrait).
2. Each prompt MUST include this exact consistency constraint at the end: "Maintain same person identity, same hairstyle, same body proportions, same outfit texture, same lighting tone."
3. The prompts should be highly descriptive, specifying lighting, background, and mood to match the analysis and brand tone.
4. Tailor the visual style to the specified platform (e.g., TikTok style might be more dynamic/candid, Shopee might be cleaner).`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            angle: { type: Type.STRING, description: 'The name of the camera angle or shot type.' },
            prompt: { type: Type.STRING, description: 'The detailed image generation prompt.' },
          },
          required: ['angle', 'prompt'],
        },
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error('No response from Gemini');
  return JSON.parse(text) as AnglePrompt[];
}

export async function generateImage(prompt: string, aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9' = '1:1'): Promise<string> {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-image-preview',
    contents: {
      parts: [
        {
          text: prompt,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio,
        imageSize: '1K',
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error('No image generated');
}
