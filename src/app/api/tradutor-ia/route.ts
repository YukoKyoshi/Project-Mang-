import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { termo } = await request.json();

    if (!termo) {
      return NextResponse.json({ resultado: '⚠️ ERRO_LOCAL: Termo vazio' });
    }

    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      return NextResponse.json({ resultado: '⚠️ ERRO_LOCAL: Chave da API ausente no Vercel' });
    }

    const prompt = `Você é um sistema especialista em busca de mangás. O usuário pesquisou por: "${termo}".
    Sua única função é traduzir ou corrigir isso para o título oficial da obra em Romaji ou Inglês (o mais usado no AniList).
    Exemplos:
    "caderno da morte" -> Death Note
    "menino que estica" -> One Piece
    "caçador x caçador" -> Hunter x Hunter
    
    Responda APENAS o nome da obra. Sem aspas, sem explicações, sem pontuação final.`;

    // 🔥 AQUI ESTÁ A MUDANÇA: Trocamos para o gemini-pro (Motor Universal)
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        safetySettings: [
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" }
        ],
        generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 20,
        }
      })
    });

    const data = await res.json();

    if (data.error) {
       return NextResponse.json({ resultado: `⚠️ ERRO_GOOGLE: ${data.error.message}` });
    }

    const textoLimpo = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    return NextResponse.json({ resultado: textoLimpo || termo });

  } catch (error: any) {
    return NextResponse.json({ resultado: `⚠️ ERRO_GERAL: ${error.message}` });
  }
}