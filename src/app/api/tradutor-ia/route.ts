import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { termo } = await request.json();

    if (!termo) {
      return NextResponse.json({ erro: 'Termo não fornecido' }, { status: 400 });
    }

    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      return NextResponse.json({ erro: 'Chave da API ausente' }, { status: 500 });
    }

    const prompt = `
      Atue como o maior especialista do mundo em banco de dados de animes e mangás.
      O usuário digitou a seguinte busca: "${termo}".
      Sua missão: Descobrir qual é a obra exata.
      Regra 1: Retorne APENAS o nome oficial da obra em Romaji ou Inglês (ex: para "caderno da morte", retorne "Death Note").
      Regra 2: Não explique nada, não use aspas, apenas devolva o nome.
    `;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // 🛡️ DESLIGANDO OS FILTROS DE SEGURANÇA PARA TÍTULOS DE AÇÃO/TERROR
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

    // Se a API do Google reclamar de algo, mandamos o erro para o F12
    if (data.error) {
       console.error("Erro interno do Gemini:", data.error);
       return NextResponse.json({ resultado: termo, erroDaIA: data.error.message });
    }

    const textoLimpo = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    return NextResponse.json({ resultado: textoLimpo || termo });

  } catch (error: any) {
    console.error("Erro geral na rota da IA:", error);
    return NextResponse.json({ erro: 'Falha na comunicação', detalhes: error.message }, { status: 500 });
  }
}