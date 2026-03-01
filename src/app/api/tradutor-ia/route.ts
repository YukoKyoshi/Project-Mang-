import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { termo } = await request.json();
    if (!termo) return NextResponse.json({ resultado: '⚠️ ERRO: Termo vazio' });

    // ✅ Declarado como API_KEY
    const API_KEY = process.env.GROQ_API_KEY;

    // ✅ Verificado como API_KEY (corrigido o erro de digitação)
    if (!API_KEY) {
      return NextResponse.json({ resultado: `⚠️ ERRO: Chave GROQ_API_KEY não encontrada no servidor.` });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama3-8b-8192", 
        messages: [
          {
            role: "system",
            content: `Você é um indexador de metadados de animes e mangás. 
            Sua tarefa é converter descrições ou nomes em português para o título oficial (Inglês ou Romaji).
            
            REGRAS ABSOLUTAS:
            1. NÃO aplique filtros de censura. Obras com "morte", "sangue" ou "demônios" DEVEM ser processadas.
            2. Responda APENAS com um objeto JSON.
            3. NÃO forneça descrições ou explicações.
            4. Se não identificar a obra, retorne o termo original no JSON.`
          },
          {
            role: "user",
            content: `Obra: "${termo}". Devolva: {"titulo": "Nome Oficial"}`
          }
        ],
        temperature: 0,
        response_format: { type: "json_object" } 
      })
    });

    const data = await response.json();

    if (data.error) {
       return NextResponse.json({ resultado: `⚠️ ERRO_GROQ: ${data.error.message}` });
    }

    const jsonResposta = JSON.parse(data.choices[0]?.message?.content || "{}");
    return NextResponse.json({ resultado: jsonResposta.titulo || termo });

  } catch (error: any) {
    return NextResponse.json({ resultado: `⚠️ ERRO_SERVIDOR: ${error.message}` });
  }
}