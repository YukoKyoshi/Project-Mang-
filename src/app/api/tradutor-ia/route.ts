import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { termo } = await request.json();
    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          { 
            role: "system", 
            content: "Você é um tradutor especializado em cultura pop. Converta termos de busca de animes/mangás em português para seus nomes oficiais em inglês ou romaji. Responda APENAS o nome oficial. Exemplo: 'Caderno da morte' -> 'Death Note'." 
          },
          { role: "user", content: termo }
        ],
        temperature: 0.1
      })
    });

    const data = await response.json();
    const resultado = data.choices[0]?.message?.content?.trim();
    return NextResponse.json({ resultado });
  } catch (error) {
    return NextResponse.json({ error: "Erro no Groq" }, { status: 500 });
  }
}