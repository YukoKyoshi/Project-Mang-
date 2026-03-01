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
        model: "llama3-8b-8192",
        messages: [
          { 
            role: "system", 
            content: `Traduza ou corrija o termo de busca de mangá/anime abaixo para o nome oficial em Romaji ou Inglês. Responda APENAS com o nome da obra.
            
            Exemplos de sucesso aprovados:
            Entrada: "caderno da morte" | Saída: Death Note
            Entrada: "menino que estica" | Saída: One Piece
            Entrada: "tales of demons" | Saída: Tales of Demons and Gods
            Entrada: "${termo}" | Saída:` 
          }
        ],
        temperature: 0.1
      })
    });

    const data = await response.json();
    // Limpeza para garantir que venha apenas o nome
    const resultado = data.choices?.[0]?.message?.content?.split('|').pop()?.replace('Saída:', '').trim() || termo;
    
    return NextResponse.json({ resultado });
  } catch (error) {
    console.error("Erro na API de Tradução:", error);
    return NextResponse.json({ resultado: "Erro" }, { status: 200 });
  }
}