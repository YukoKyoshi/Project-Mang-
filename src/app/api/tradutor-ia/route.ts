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
            content: "Você é um tradutor de elite de cultura pop. Converta nomes de animes/mangás do português para o nome oficial em inglês ou romaji. Responda APENAS o nome. Ex: 'Menino de borracha' -> 'One Piece', 'Caderno da morte' -> 'Death Note'." 
          },
          { role: "user", content: termo }
        ],
        temperature: 0.1 // Precisão máxima
      })
    });

    const data = await response.json();
    const resultado = data.choices?.[0]?.message?.content?.trim() || termo;
    return NextResponse.json({ resultado });
  } catch (error) {
    return NextResponse.json({ resultado: "Erro" }, { status: 200 });
  }
}