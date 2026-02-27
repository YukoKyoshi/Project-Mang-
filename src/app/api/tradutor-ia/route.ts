import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { termo } = await request.json();

    if (!termo) {
      return NextResponse.json({ erro: 'Termo não fornecido' }, { status: 400 });
    }

    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      console.error("ERRO: Chave da API não encontrada no .env.local");
      return NextResponse.json({ erro: 'Erro interno de configuração' }, { status: 500 });
    }

    // O "Prompt" (A ordem estrita que damos para a I.A.)
    const prompt = `
      Atue como o maior especialista do mundo em banco de dados de animes e mangás (AniList e MyAnimeList).
      O usuário digitou a seguinte busca: "${termo}".
      
      Sua missão: Descobrir qual é a obra exata.
      Regra 1: Retorne APENAS o nome oficial da obra em Romaji (japonês romanizado) ou Inglês, que seja o mais perfeito para encontrar no AniList.
      Regra 2: Se o usuário digitou uma descrição (ex: "mangá do menino de borracha"), retorne o nome da obra (ex: "One Piece").
      Regra 3: Se o usuário digitou algo com "x" ou caracteres confusos (ex: "Caçador x Caçador"), conserte para o nome real (ex: "Hunter x Hunter").
      Regra 4: NÃO retorne nenhum outro texto, pontuação, aspas ou explicações. Apenas o nome da obra.
    `;

    // Conectando com a I.A.
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.1, // Temperatura baixa para respostas diretas e sem criatividade inventada
            maxOutputTokens: 20,
        }
      })
    });

    const data = await res.json();
    const textoLimpo = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    return NextResponse.json({ resultado: textoLimpo || termo });

  } catch (error) {
    console.error("Erro na rota da IA:", error);
    return NextResponse.json({ erro: 'Falha na comunicação com a IA' }, { status: 500 });
  }
}