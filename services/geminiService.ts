import { GoogleGenAI, Type } from "@google/genai";
import { AspectRatio, GeneratedPrompt, ThumbnailElements } from "../types";

// --- Helper to fetch image as base64 ---
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- NEW: Character Analysis ---
export const analyzeCharacterReference = async (file: File): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const imagePart = await fileToGenerativePart(file);
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    imagePart,
                    { text: "Describe this person's physical appearance in detail for an image generation prompt. Focus on: hair color/style, facial features, skin tone, glasses/accessories, and gender. Keep it concise (e.g., 'Young man with short brown messy hair, wearing glasses, light skin tone'). Do not describe clothing or background." }
                ]
            }
        });
        return response.text || "";
    } catch (e) {
        console.error("Character analysis failed", e);
        return "";
    }
};

// --- 1. Generate Prompt Logic (Thinking + Search) ---
export const generateThumbnailPrompt = async (
  topic: string,
  style: string,
  referenceUrl: string,
  includeTrends: boolean,
  elements?: ThumbnailElements
): Promise<GeneratedPrompt> => {
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemInstruction = `You are an elite YouTube Thumbnail Strategist and AI Prompt Engineer (Midjourney/DALL-E 3 Expert). 
  Your goal is to create high-performing, click-worthy thumbnail prompts that look professional, not generic AI art.
  
  CORE PRINCIPLES:
  1. **Visual Hierarchy**: Clear focal point, high contrast between subject and background.
  2. **Professional Aesthetics**: Use terms like "8k resolution", "unreal engine 5 render", "studio lighting", "octane render", "sharp focus".
  3. **Graphical Elements**: Incorporate arrows, circles, speed lines, or emojis as 3D or graphical elements within the scene if relevant to the style.
  4. **Face/Faceless**: Respect the user's choice to show a face or be faceless.
  
  CRITICAL OUTPUT RULES:
  1. The output JSON must be in English. Even if the topic provided is in another language, translate the logic and visual description into English.
  2. If the user requests text in a specific language (e.g. Persian), the instruction in the prompt should say: 'Text in [Language] saying "[Text]"'.
  3. Output valid JSON only.`;

  // Construct Composition Constraints
  let constraints = "";
  
  if (elements) {
    
    // Character Logic
    if (elements.faceVisibility === 'Faceless') {
         constraints += `\n- CHARACTER MODE: FACELESS. Focus on hands, body language, holding objects, or back view. Do NOT show the face.`;
    } else if (elements.characterDescription) {
        constraints += `\n- MAIN CHARACTER: ${elements.characterDescription}. Ensure the face is high quality, expressive, and detailed.`;
    } else {
        constraints += `\n- MAIN CHARACTER: Create a generic but expressive character suitable for the topic.`;
    }

    if (elements.characterPosition) {
        constraints += ` Position the character on the ${elements.characterPosition} side of the frame.`;
    }

    // 1. TEXT LOGIC
    if (elements.addText) {
       // If AI Optimize Text is ON, we just give a goal
       if (elements.aiOptimizeText) {
           constraints += `\n- TEXT OPTIMIZATION: AI, choose the best impactful text (2-5 words), font, color, and position to maximize CTR. Text Language: ${elements.textLanguage}. IMPORTANT: Text must be legible and NOT touching the very edge of the image.`;
       } else {
           // Manual Controls
           if (elements.textMode === 'Custom' && elements.customText) {
             constraints += `\n- TEXT OVERLAY: The image MUST include the exact text "${elements.customText}". Verify the spelling.`;
           } else {
             constraints += `\n- TEXT OVERLAY: Create a short, punchy, viral 2-4 word catchphrase in ${elements.textLanguage} language.`;
           }
           
           if (elements.fontStyle) {
             constraints += `\n- FONT: Use ${elements.fontStyle} typography. Big, Bold, and Impactful.`;
             if (elements.textLanguage === 'Persian') constraints += " Ensure correct Persian glyph connections and modern styling.";
           }
           
           if (elements.textEffect !== 'None') constraints += `\n- TEXT EFFECT: Apply ${elements.textEffect}. Make it pop off the background.`;
           if (elements.textColor) constraints += `\n- TEXT COLOR: ${elements.textColor}.`;
           if (elements.textPosition) constraints += `\n- TEXT POSITION: Place text in the ${elements.textPosition} of the frame. CRITICAL: Leave a 10% safety margin from the edge to avoid cropping.`;
       }
    } else {
       constraints += `\n- NO TEXT: Do not include any text or words in the image. Focus purely on visuals.`;
    }

    // 2. BACKGROUND LOGIC
    if (elements.aiOptimizeBackground) {
        constraints += `\n- BACKGROUND OPTIMIZATION: AI, select the most engaging background that suits the niche (e.g. detailed environment vs solid color) to separate the subject. Add depth.`;
    } else {
        constraints += `\n- BACKGROUND: Mode ${elements.backgroundMode}.`;
        if (elements.backgroundMode === 'Blurred') constraints += " Heavy bokeh/depth of field to isolate subject.";
        if (elements.backgroundMode === 'Solid White') constraints += " Clean studio white background for professional look.";
        if (elements.backgroundMode === 'Green Screen') constraints += " Solid chroma key green background.";
        if (elements.backgroundMode === 'Detailed Environment') constraints += " Rich, detailed, immersive environment related to topic.";
    }

    // 3. FRAMING LOGIC
    if (elements.aiOptimizeFraming) {
        constraints += `\n- FRAMING OPTIMIZATION: AI, choose the best camera angle (Close-up, Wide, etc.) to tell the story.`;
    } else {
        constraints += `\n- FRAMING: ${elements.shotType}.`;
    }

    // 4. LIGHTING & VIBE LOGIC
    if (elements.aiOptimizeLighting) {
        constraints += `\n- LIGHTING/MOOD OPTIMIZATION: AI, choose the lighting and subject expression that triggers the highest emotional response.`;
    } else {
        constraints += `\n- LIGHTING: ${elements.lighting}.`;
        if (elements.expression && elements.expression !== 'Neutral' && elements.faceVisibility !== 'Faceless') {
             constraints += `\n- EXPRESSION: Subject must show intense ${elements.expression}.`;
        }
    }

    // Global Overrides
    if (elements.highSaturation) {
      constraints += `\n- COLOR: Boost saturation and vibrance to maximum. Use high contrast colors.`;
    }
    
    // Custom User Instructions
    if (elements.customInstructions) {
      constraints += `\n- SPECIFIC USER INSTRUCTION: ${elements.customInstructions} (Ensure this is integrated seamlessly).`;
    }
  }

  // Handle Reference URL
  let refInstruction = "";
  if (referenceUrl) {
    refInstruction = `\nREFERENCE URL: ${referenceUrl}\n(If this is a valid URL, use the googleSearch tool to understand the visual style of this page/video and incorporate it).`;
  }

  const prompt = `
    Video Topic (Input): ${topic}
    Desired Style: ${style}
    ${refInstruction}
    ${includeTrends ? "Please search for current trending visual styles for this niche on YouTube in late 2024/2025 and incorporate them." : ""}
    
    Specific Composition Constraints:${constraints}
    
    ADDITIONAL VISUAL INSTRUCTIONS:
    - Include graphical elements like arrows, circles, or icons (3D rendered) if they enhance the click-through rate.
    - Make it look like a high-budget YouTube thumbnail, not a standard stock photo.
    - Ensure lighting is dramatic and cinematic.

    Instructions:
    1. Analyze the topic and constraints.
    2. Create a detailed image generation prompt in ENGLISH.
    3. Break down the prompt into semantic segments (Subject, Action, Environment, Lighting, Composition).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 32768 }, 
        tools: (includeTrends || referenceUrl) ? [{ googleSearch: {} }] : undefined,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            promptText: { type: Type.STRING, description: "The full, cohesive prompt string combining all elements in English." },
            segments: {
              type: Type.OBJECT,
              properties: {
                subject: { type: Type.STRING },
                action: { type: Type.STRING },
                environment: { type: Type.STRING },
                lighting: { type: Type.STRING },
                composition: { type: Type.STRING }
              },
              required: ["subject", "action", "environment", "lighting", "composition"]
            },
            visualStyle: { type: Type.STRING },
            reasoning: { type: Type.STRING }
          },
          required: ["title", "promptText", "segments", "visualStyle"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as GeneratedPrompt;
    }
    throw new Error("No text response generated");

  } catch (error) {
    console.error("Error generating prompt:", error);
    throw error;
  }
};

// --- NEW: Pinterest Suggestion ---
export const getPinterestSuggestions = async (topic: string): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Find 5 trending visual aesthetic descriptions for "${topic}" on Pinterest. What styles are popular? Output a simple JSON array of strings (e.g. ["Pastel minimalist with bold typography", "Dark mode neon cyber"]).`;
  
  try {
     const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return response.text ? JSON.parse(response.text) : [];
  } catch (e) {
    console.error(e);
    return [];
  }
};

// --- 2. Analyze Image (Image to Prompt) ---
export const analyzeImageForPrompt = async (file: File, focusMode: string = 'Full Prompt'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const imagePart = await fileToGenerativePart(file);

  let promptInstruction = "Analyze this YouTube thumbnail. Reverse engineer it into a highly detailed AI image generation prompt in English. Describe the subject, lighting, composition, camera angle, and artistic style. Output ONLY the prompt text.";
  
  if (focusMode === 'Composition') {
    promptInstruction = "Analyze ONLY the composition, layout, and visual hierarchy of this thumbnail. Describe where elements are placed. Output in English.";
  } else if (focusMode === 'Color Palette') {
    promptInstruction = "Analyze ONLY the color palette, lighting mood, and contrast techniques used in this thumbnail. Output in English.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          imagePart,
          { text: promptInstruction }
        ]
      }
    });

    return response.text || "Could not analyze image.";
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
};

// --- 3. Improve/Remake Thumbnail (Image -> Critique -> New Prompt) ---
export const improveThumbnailConcept = async (file: File, creativityLevel: string = 'Subtle Polish'): Promise<{ critique: string; improvedPrompt: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const imagePart = await fileToGenerativePart(file);

  let instruction = "1. CRITIQUE: Identify specific weak points affecting Click-Through Rate (CTR). 2. IMPROVE: Create a BRAND NEW, highly optimized AI image generation prompt to re-create a BETTER version of this concept.";

  if (creativityLevel === 'Extreme Makeover') {
    instruction += " NOTE: Be extremely creative. Change the style completely if needed to make it go viral. Suggest a radical new approach while keeping the core topic.";
  } else {
    instruction += " NOTE: Keep the original concept and composition, but improve lighting, quality, and clarity.";
  }

  const prompt = `
    Analyze this YouTube thumbnail image as an expert strategist.
    ${instruction}
    Ensure the improved prompt is in ENGLISH.
    Output JSON only.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          imagePart,
          { text: prompt }
        ]
      },
      config: {
        thinkingConfig: { thinkingBudget: 16000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            critique: { type: Type.STRING },
            improvedPrompt: { type: Type.STRING }
          },
          required: ["critique", "improvedPrompt"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No response generated");

  } catch (error) {
    console.error("Error improving thumbnail:", error);
    throw error;
  }
};


// --- 4. Generate Image (Visualization) ---
export const generateThumbnailImage = async (
  prompt: string, 
  aspectRatio: AspectRatio,
  resolution: string = "1K"
): Promise<string> => {
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: resolution 
        }
      }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

// --- 5. Edit Image (Nano Banana / Flash Image) ---
export const editThumbnailImage = async (
  originalImageBase64: string,
  editInstruction: string
): Promise<string> => {
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const cleanBase64 = originalImageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: "image/png" 
            }
          },
          { text: editInstruction }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
     throw new Error("No edited image returned");

  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
};