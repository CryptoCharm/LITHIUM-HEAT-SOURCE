import { GoogleGenAI } from "@google/genai";
import { AspectRatio, ImageResolution, GeminiConfig } from "../types";

// Helper to check API Key (Client-side key selection for Paid features)
export const ensureApiKey = async (forceSelection: boolean = false): Promise<string> => {
  const win = window as any;
  // Use window.aistudio if available (for paid key selection), otherwise fallback to env
  // Note: For gemini-3-pro-image-preview, a paid key is often required/recommended via the selector
  if (win.aistudio) {
    if (forceSelection) {
        await win.aistudio.openSelectKey();
    } else {
        const hasKey = await win.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await win.aistudio.openSelectKey();
        }
    }
  }
  
  if (!process.env.API_KEY) {
     // In a real scenario without the wrapper, we might throw here, 
     // but we assume the environment injects it or the sidebar handles it.
     // For this code, we rely on the injected process.env.API_KEY
  }
  return process.env.API_KEY || '';
};

const getModelName = (res: ImageResolution) => {
  // Requirement: Use 'nano banana pro' equivalent which is 'gemini-3-pro-image-preview'
  // Only pro supports 2K/4K
  return 'gemini-3-pro-image-preview';
};

// Map unsupported aspect ratios to nearest supported ones to prevent 500/400 errors
// Supported: "1:1", "3:4", "4:3", "9:16", "16:9"
const sanitizeAspectRatio = (ratio: AspectRatio): string => {
  switch (ratio) {
    case AspectRatio.PORTRAIT_2_3:
      return '3:4'; // Closest supported vertical
    case AspectRatio.LANDSCAPE_3_2:
      return '4:3'; // Closest supported horizontal
    default:
      return ratio;
  }
};

export const generateImages = async (config: GeminiConfig): Promise<string[]> => {
  let apiKey = await ensureApiKey();
  const modelName = getModelName(config.resolution);
  
  // Construct the prompt based on mode
  let finalPrompt = config.prompt;
  
  if (config.mode === 'SUITE') {
    finalPrompt = `Professional E-Commerce Photography: ${config.prompt}. 
    Style: High-end commercial, clean lighting, product focused. 
    Ensure consistency in lighting and presentation.`;
  } else if (config.mode === 'RESTORE') {
    // Strict prompt for restoration
    finalPrompt = `High fidelity image restoration and upscale. 
    Objectives: Enhance clarity, fix lighting, remove noise, sharpen details.
    Constraints: DO NOT change facial features, product details, or composition. 
    Maintain aspect ratio strictly. Output photorealistic commercial quality.
    ${config.prompt ? `Additional adjustments: ${config.prompt}` : ''}`;
  }

  const parts: any[] = [{ text: finalPrompt }];
  
  // If there's an input image, add it
  if (config.image) {
    // config.image is expected to be a data URL, we need to strip the prefix
    const base64Data = config.image.split(',')[1];
    const mimeType = config.image.substring(config.image.indexOf(':') + 1, config.image.indexOf(';'));
    
    parts.unshift({
      inlineData: {
        mimeType: mimeType,
        data: base64Data
      }
    });
  }

  const generatedImages: string[] = [];
  const MAX_RETRIES = 3;
  const safeAspectRatio = sanitizeAspectRatio(config.aspectRatio);

  try {
    // Generate sequentially to ensure we get individual results we can process
    for (let i = 0; i < config.count; i++) {
        let attempt = 0;
        let success = false;

        while (!success && attempt < MAX_RETRIES) {
          try {
            // Create a new instance for safety with keys
            const freshAi = new GoogleGenAI({ apiKey });
            
            const response = await freshAi.models.generateContent({
                model: modelName,
                contents: { parts },
                config: {
                    imageConfig: {
                        aspectRatio: safeAspectRatio,
                        imageSize: config.resolution, // 1K, 2K, 4K
                    }
                }
            });

            // Extract image
            if (response.candidates && response.candidates[0].content.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                         generatedImages.push(`data:image/png;base64,${part.inlineData.data}`);
                    }
                }
            }
            success = true;

          } catch (error: any) {
            console.error(`Gemini Attempt ${attempt + 1} Error:`, error);
            
            // Handle 403 / Permission Denied
            if (
                error.status === 403 || 
                error.code === 403 || 
                (error.message && (error.message.includes('403') || error.message.includes('PERMISSION_DENIED') || error.message.includes('The caller does not have permission')))
            ) {
                 console.log("Permission denied. Prompting for key re-selection...");
                 apiKey = await ensureApiKey(true); // Force re-selection
                 // Retry with new key immediately in next loop iteration? 
                 // If we don't break, we continue loop. 
                 // We rely on 'attempt' incrementing to prevent infinite loops, 
                 // but if we got a new key, we realistically want to retry cleanly.
                 // However, sticking to retry logic:
            } 
            // Handle 500/503 Server Errors
            else if (
                error.status === 500 || error.status === 503 ||
                error.code === 500 || error.code === 503 ||
                (error.message && (error.message.includes('500') || error.message.includes('503') || error.message.includes('INTERNAL') || error.message.includes('UNAVAILABLE')))
            ) {
                 const delay = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
                 console.log(`Server error, retrying in ${delay}ms...`);
                 await new Promise(r => setTimeout(r, delay));
            } 
            else {
                 // Non-retriable error
                 if (attempt === MAX_RETRIES - 1) throw error;
            }

            attempt++;
            if (attempt === MAX_RETRIES) {
                // If we failed after all retries
                throw error;
            }
          }
        }
    }
  } catch (error) {
    console.error("Gemini Generation Final Error:", error);
    throw error;
  }

  return generatedImages;
};

// Helper for multimodal understanding (Step 2 of Suite Generation)
export const understandRequirements = async (text: string, imageBase64?: string): Promise<string> => {
  const apiKey = await ensureApiKey();
  const ai = new GoogleGenAI({ apiKey });
  
  // Use Flash for fast text/multimodal understanding
  const model = "gemini-2.5-flash"; 
  
  const parts: any[] = [
    { text: `You are an expert E-Commerce Operation Assistant. 
    Analyze the following request and/or product image. 
    Suggest a detailed image generation prompt optimized for Amazon/Shopify listings.
    Focus on: Lighting, Angle, Background (Lifestyle or White), and Selling Points.
    User Request: ${text}` }
  ];

  if (imageBase64) {
    const base64Data = imageBase64.split(',')[1];
    const mimeType = imageBase64.substring(imageBase64.indexOf(':') + 1, imageBase64.indexOf(';'));
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: base64Data
      }
    });
  }

  try {
      const response = await ai.models.generateContent({
        model,
        contents: { parts }
      });
      return response.text || "Could not analyze requirements.";
  } catch (e) {
      console.error("Understand Requirements Error:", e);
      // Fallback
      return "Error analyzing requirements. Please try again.";
  }
};