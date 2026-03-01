import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { termo } = await request.json();
    const apiKey = process.env.GROQ_API_KEY;

    // 1. Verifica se a chave existe
    if (!apiKey) {
      console.error("❌ ERRO: GROQ_API_KEY não configurada no servidor.");
      return NextResponse.json({ resultado: termo }); // Retorna o termo original para não travar a busca
    }

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
            content: "Você é um tradutor. Converta nomes de animes/mangás do português para o nome oficial em inglês/romaji. Responda APENAS o nome. Ex: 'Caderno da morte' -> 'Death Note'." 
          },
          { role: "user", content: termo }
        ],
        temperature: 0.2
      })
    });

    const data = await response.json();

    // 2. Verifica se a resposta do Groq é válida
    if (data.choices && data.choices[0]?.message?.content) {
      const resultado = data.choices[0].message.content.trim();
      return NextResponse.json({ resultado });
    } else {
      console.error("⚠️ Groq retornou um formato inesperado ou erro:", data);
      return NextResponse.json({ resultado: termo }); // Fallback para o termo original
    }

  } catch (error) {
    console.error("🚨 Erro crítico na Rota de IA:", error);
    // Em caso de erro total, retornamos o termo original para a busca do AniList tentar a sorte
    const { termo } = await request.json().catch(() => ({ termo: "" }));
    return NextResponse.json({ resultado: termo });
  }
}