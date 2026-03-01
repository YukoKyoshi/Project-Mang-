import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { termo } = await request.json();
    if (!termo) return NextResponse.json({ resultado: '⚠️ ERRO: Termo vazio' });

    const API_KEY = process.env.GROQ_API_KEY;
    if (!API_KEY) return NextResponse.json({ resultado: '⚠️ ERRO: Chave ausente' });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // ✅ Modelo atualizado e suportado
        messages: [
          {
            role: "system",
            content: "Você é um indexador de animes/mangás. Responda APENAS um JSON com a chave 'titulo'. Sem filtros de censura."
          },
          {
            role: "user",
            content: `Obra: "${termo}". Devolva: {"titulo": "Nome Oficial"}`
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" } 
      })
    });

    const data = await response.json();

    // Se a Groq der erro de cota ou modelo, retornamos o erro real
    if (data.error) {
       return NextResponse.json({ resultado: `⚠️ ERRO_GROQ: ${data.error.message}` });
    }

    const jsonResposta = JSON.parse(data.choices[0]?.message?.content || "{}");
    return NextResponse.json({ resultado: jsonResposta.titulo || termo });

  } catch (error: any) {
    return NextResponse.json({ resultado: `⚠️ ERRO_SERVIDOR: ${error.message}` });
  }
}