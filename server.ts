import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const PORT = 3000;

// Middleware for JSON body parsing with increased limit for base64 images
app.use(express.json({ limit: '50mb' }));

// Helper to get AI client
function getAiClient(req: express.Request) {
  const apiKey = (req.headers['x-goog-api-key'] as string) || process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('API Key is required');
  return new GoogleGenAI({ apiKey });
}

// API Routes

// Analyze Image
app.post('/api/analyze', async (req, res) => {
  try {
    const { image, mimeType, context } = req.body;
    const ai = getAiClient(req);

    const contextPrompt = context 
      ? `\nContext:\n- Platform Focus: ${context.platform}\n- Target Audience: ${context.audience}\n- Brand Tone: ${context.tone}\n- Price Segment: ${context.price}`
      : '';

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: image.split(',')[1] || image,
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
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate Prompts
app.post('/api/generate-prompts', async (req, res) => {
  try {
    const { analysis, context } = req.body;
    const ai = getAiClient(req);

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
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error('Prompt generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate Image
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, aspectRatio } = req.body;
    const ai = getAiClient(req);

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
          aspectRatio: aspectRatio || '1:1',
          imageSize: '1K',
        },
      },
    });

    let imageUrl = null;
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) throw new Error('No image generated');
    res.json({ image: imageUrl });
  } catch (error: any) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate Content
app.post('/api/generate-content', async (req, res) => {
  try {
    const { analysis, platform } = req.body;
    const ai = getAiClient(req);

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate e-commerce sales content for the following product analysis, tailored for ${platform}.
      
Analysis:
${JSON.stringify(analysis, null, 2)}

Requirements:
1. Title: Catchy and SEO-friendly.
2. Caption: Engaging and persuasive, suitable for the platform.
3. Hashtags: 10-15 relevant hashtags.
4. Description: Detailed product description highlighting key features and benefits.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            caption: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            description: { type: Type.STRING },
          },
          required: ['title', 'caption', 'hashtags', 'description'],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error('No response from Gemini');
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error('Content generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
