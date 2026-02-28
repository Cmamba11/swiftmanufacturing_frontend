
import { GoogleGenAI } from "@google/genai";
import { Product, Transaction, TransactionType } from "../types";

export const analyzeMovement = async (products: Product[], transactions: Transaction[]) => {
  // Use the required initialization pattern: new GoogleGenAI({apiKey: process.env.API_KEY})
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const recentTransactions = transactions.slice(-50).map(t => ({
    date: new Date(t.timestamp).toLocaleDateString(),
    product: products.find(p => p.id === t.productId)?.name,
    type: t.type,
    qty: t.quantity
  }));

  const prompt = `
    As an expert Supply Chain Analyst, evaluate the following manufacturing movement data.
    Products: ${JSON.stringify(products.map(p => ({ id: p.id, name: p.name, type: p.type })))}
    Recent Transactions: ${JSON.stringify(recentTransactions)}

    Provide a concise analysis in markdown including:
    1. Identification of Fast-moving items (high dispatch frequency).
    2. Identification of Slow-moving items (low dispatch frequency relative to intake).
    3. Critical stock alerts (if any).
    4. Recommendations for warehouse space optimization.
    
    Keep it professional and industrial-focused.
  `;

  try {
    // Upgraded to gemini-3-pro-preview for complex reasoning task as per guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    // Access response text via the .text property (not a method)
    return response.text;
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return "Analysis unavailable at this time. Please check your network or API key.";
  }
};
