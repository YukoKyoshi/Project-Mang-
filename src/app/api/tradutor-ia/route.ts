import { NextResponse } from 'next/server';

// ==========================================
// 🧠 ROTA DA API: TRADUTOR I.A. (MODO JSON FORÇADO)
// ==========================================
export async function POST(request: Request) {
  try {
    const { termo } = await request.json();

    if (!termo) return NextResponse.json({ resultado: '⚠️ ERRO_LOCAL: Termo vazio' });

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) return NextResponse.json({ resultado: '⚠️ ERRO_LOCAL: Chave da API ausente no Vercel' });

    // Prompt focado pedindo uma estrutura de dados exata
    const prompt = `Identifique a qual mangá, manhwa, novel ou anime o usuário está se referindo: "${termo}".
    Devolva um JSON válido contendo APENAS a chave "titulo" com o nome oficial da obra em Romaji ou Inglês (o mais usado no AniList).
    Exemplo: Se a busca for "samurai que tem um x na cara", devolva {"titulo": "Rurouni Kenshin"}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
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
            // 🔥 A ARMA SUPREMA: Força a IA a não conversar e devolver apenas código JSON puro!
            responseMimeType: "application/json"
        }
      })
    });

    const data = await res.json();

    if (data.error) {
       return NextResponse.json({ resultado: `⚠️ ERRO_API: ${data.error.message}` });
    }

    const candidato = data.candidates?.[0];
    const jsonText = candidato?.content?.parts?.[0]?.text;
    
    if (!jsonText) return NextResponse.json({ resultado: termo });

    // 🎯 Lemos o JSON puro e extraímos apenas o título perfeito
    const respostaIA = JSON.parse(jsonText);

    return NextResponse.json({ resultado: respostaIA.titulo || termo });

  } catch (error: any) {
    return NextResponse.json({ resultado: `⚠️ ERRO_SERVIDOR: ${error.message}` });
  }
}