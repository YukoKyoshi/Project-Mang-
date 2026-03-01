import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { termo } = await request.json();
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) return NextResponse.json({ resultado: termo });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // ✅ Modelo atualizado (O llama3-8b-8192 foi desativado)
        messages: [
          { 
            role: "system", 
            content: `Você é um tradutor de elite. Converta termos de busca de animes/mangás para o nome oficial em Inglês ou Romaji. Responda APENAS o nome.
            
            Exemplos aprovados:
            Entrada: "caderno da morte" | Saída: Death Note
            Entrada: "menino que estica" | Saída: One Piece
            Entrada: "tales of demons" | Saída: Tales of Demons and Gods
            Entrada: "${termo}" | Saída:` 
          }
        ],
        temperature: 0.1,
        max_tokens: 50
      })
    });

    const data = await response.json();
    // Limpeza da resposta para garantir apenas o título
    const resultado = data.choices?.[0]?.message?.content?.split('|').pop()?.replace('Saída:', '').trim() || termo;
    
    return NextResponse.json({ resultado });
  } catch (error) {
    return NextResponse.json({ resultado: "Erro na IA" }, { status: 200 });
  }
}