import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export interface DetectionResult {
  isHealthy: boolean;
  percentage: number;
  diseaseName?: string;
  explanation: string;
  actionSteps: string[];
}

export async function detectPlantHealth(base64Image: string): Promise<DetectionResult> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Lakukan analisis kesehatan tanaman pada gambar ini. 
  Berikan jawaban dalam format JSON murni dengan struktur:
  {
    "isHealthy": boolean,
    "percentage": number (0-100),
    "diseaseName": string (hanya jika tidak sehat, dalam Bahasa Indonesia),
    "explanation": string (penjelasan singkat dalam Bahasa Indonesia),
    "actionSteps": string[] (langkah-langkah yang harus dilakukan dalam Bahasa Indonesia)
  }
  Jangan berikan teks tambahan selain JSON.`;

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: base64Image.split(",")[1] || base64Image,
    },
  };

  const response = await ai.models.generateContent({
    model,
    contents: { parts: [imagePart, { text: prompt }] },
    config: {
      responseMimeType: "application/json",
    },
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse AI response:", e);
    throw new Error("Gagal menganalisis gambar. Silakan coba lagi.");
  }
}

export async function chatWithAI(message: string, history: { role: "user" | "model"; parts: { text: string }[] }[]) {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `Anda adalah ahli pertanian cerdas bernama "Sobat Tani". 
  Tugas Anda adalah membantu petani dan pekerja kebun dengan informasi tentang perawatan tanaman, 
  identifikasi hama, jadwal tanam, dan solusi pertanian organik maupun modern. 
  Gunakan bahasa Indonesia yang ramah, jelas, dan mudah dipahami oleh petani.`;

  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction,
    },
    history,
  });

  const response = await chat.sendMessage({ message });
  return response.text;
}
