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
            content: `Você é um tradutor de elite de cultura pop. Sua única tarefa é converter termos de busca de animes/mangás do português para o nome oficial em Inglês ou Romaji. 

            Siga EXATAMENTE este modelo:
            Entrada: "caderno da morte" | Saída: Death Note
            Entrada: "menino que estica" | Saída: One Piece
            Entrada: "tales of demons" | Saída: Tales of Demons and Gods
            Entrada: "${termo}" | Saída:` 
          }
        ],
        temperature: 0.1, // Precisão máxima
        max_tokens: 50 // Resposta curta
      })
    });

    const data = await response.json();
    // Limpamos qualquer resíduo de texto extra que o Llama possa tentar colocar
    const resultado = data.choices?.[0]?.message?.content?.split('|')[0]?.replace('Saída:', '')?.trim() || termo;
    
    return NextResponse.json({ resultado });
  } catch (error) {
    return NextResponse.json({ resultado: "Erro" }, { status: 200 });
  }
}