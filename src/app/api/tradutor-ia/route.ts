import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { termo } = await request.json();

    if (!termo) return NextResponse.json({ resultado: '⚠️ ERRO_LOCAL: Termo vazio' });

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) return NextResponse.json({ resultado: '⚠️ ERRO_LOCAL: Chave da API ausente no Vercel' });

    // O PROMPT BLINDADO: Direto ao ponto, sem margem para ela "conversar"
    const prompt = `Traduza ou corrija o termo de busca de mangá abaixo para o nome oficial em Romaji ou Inglês.
    Exemplos:
    Entrada: "caderno da morte" | Saída: Death Note
    Entrada: "menino que estica" | Saída: One Piece
    
    Entrada: "${termo}" | Saída:`;

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
        generationConfig: { temperature: 0.1, maxOutputTokens: 20 }
      })
    });

    const data = await res.json();

    // 🔍 RAIO-X 1: Verifica se o Google deu erro de API (ex: Modelo não encontrado)
    if (data.error) {
       return NextResponse.json({ resultado: `⚠️ ERRO_API: ${data.error.message}` });
    }

    // 🔍 RAIO-X 2: Verifica se a IA bloqueou geral por segurança
    if (!data.candidates || data.candidates.length === 0) {
       const blockReason = data.promptFeedback?.blockReason || 'Motivo Desconhecido';
       return NextResponse.json({ resultado: `⚠️ BLOQUEADO_PELA_IA: ${blockReason}` });
    }

    const candidato = data.candidates[0];

    // 🔍 RAIO-X 3: Verifica se a IA começou a falar e foi censurada no meio
    if (candidato.finishReason !== 'STOP') {
        return NextResponse.json({ resultado: `⚠️ RESPOSTA_CENSURADA: ${candidato.finishReason}` });
    }

    const textoLimpo = candidato.content?.parts?.[0]?.text?.trim();

    // Se passou por todas as travas, devolve o nome limpo!
    return NextResponse.json({ resultado: textoLimpo || termo });

  } catch (error: any) {
    return NextResponse.json({ resultado: `⚠️ ERRO_SERVIDOR: ${error.message}` });
  }
}