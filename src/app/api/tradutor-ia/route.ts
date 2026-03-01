import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { termo } = await request.json();

    if (!termo) return NextResponse.json({ resultado: '⚠️ ERRO: Termo vazio' });

    // ✅ Agora usamos a chave do Groq
    const API_KEY = process.env.GROQ_API_KEY;
    if (!API_KEY) return NextResponse.json({ resultado: '⚠️ ERRO: Chave GROQ_API_KEY ausente' });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama3-8b-8192", // Modelo rápido e inteligente
        messages: [
          {
            role: "system",
            content: "Você é um especialista em cultura pop (animes/mangás). Sua tarefa é identificar a obra descrita pelo usuário e retornar APENAS um JSON com o título oficial. Não converse."
          },
          {
            role: "user",
            content: `Identifique a obra: "${termo}". Devolva um JSON válido contendo APENAS a chave "titulo" com o nome oficial em Romaji ou Inglês. Exemplo: {"titulo": "Rurouni Kenshin"}`
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" } // Força o Groq a entregar JSON puro
      })
    });

    const data = await response.json();
    
    if (data.error) {
       return NextResponse.json({ resultado: `⚠️ ERRO_GROQ: ${data.error.message}` });
    }

    const jsonResposta = JSON.parse(data.choices[0]?.message?.content || "{}");
    const resultadoFinal = jsonResposta.titulo || termo;

    return NextResponse.json({ resultado: resultadoFinal });

  } catch (error: any) {
    console.error("Erro na Rota Groq:", error);
    return NextResponse.json({ resultado: `⚠️ ERRO_SERVIDOR: ${error.message}` });
  }
}