import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// =============================================================================
// [SESSÃO 1] - SETUP E SUPABASE
// =============================================================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// 🔥 Usa a Chave Mestra se existir, senão cai para a Anônima
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// =============================================================================
// [SESSÃO 2] - LOGICA DE SINCRONIZAÇÃO BI-DIRECIONAL
// =============================================================================
export async function POST(request: Request) {
  try {
    const { token, usuario, tipoObra, acao } = await request.json();
    if (!token) return NextResponse.json({ error: "Token ausente" }, { status: 401 });

    // --- SUB-SESSÃO 2.1: PUXAR DO ANILIST (PULL) ---
    if (acao === "PULL") {
      // 1. Pegar ID do usuário no AniList
      const viewerRes = await fetch('https://graphql.anilist.co', {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `query { Viewer { id } }` })
      });
      const viewerData = await viewerRes.json();
      const aniUserId = viewerData.data?.Viewer?.id;

      if (!aniUserId) return NextResponse.json({ error: "Falha ao obter ID do AniList" }, { status: 400 });

      // 2. Buscar coleção completa
      const query = `query ($userId: Int, $type: MediaType) { MediaListCollection(userId: $userId, type: $type) { lists { entries { progress status media { id title { romaji english } coverImage { large } chapters episodes } } } } }`;
      const listRes = await fetch('https://graphql.anilist.co', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { userId: aniUserId, type: tipoObra === "ANIME" ? "ANIME" : "MANGA" } })
      });
      const listData = await listRes.json();
      const entries = listData.data?.MediaListCollection?.lists.flatMap((l: any) => l.entries) || [];

      if (entries.length === 0) return NextResponse.json({ success: true, count: 0 });

      // 3. Preparar array para Upsert em Lote (Bulk Upsert)
      const tabela = tipoObra === "ANIME" ? "animes" : "mangas";
      const mapaStatus: any = { CURRENT: "Lendo", COMPLETED: "Completos", PLANNING: "Planejo Ler", DROPPED: "Dropados", PAUSED: "Pausados" };

      // Transforma o array do AniList no formato exato do nosso banco
      const obrasParaSalvar = entries.map((entry: any) => ({
        usuario: usuario,
        titulo: entry.media.title.romaji || entry.media.title.english || "Obra Desconhecida",
        capa: entry.media.coverImage.large,
        capitulo_atual: entry.progress,
        total_capitulos: entry.media.chapters || entry.media.episodes || 0,
        status: mapaStatus[entry.status] || "Lendo",
        ultima_leitura: new Date().toISOString()
      }));

      // 4. Executar o Upsert de uma vez só e TRATAR O ERRO
      const { error } = await supabase.from(tabela).upsert(obrasParaSalvar, { onConflict: 'usuario, titulo' });

      // 🔥 Se o Supabase bloquear, estouramos o erro!
      if (error) {
        console.error("Erro CRÍTICO no Supabase:", error);
        throw new Error(`Erro do Banco: ${error.message}`);
      }

      return NextResponse.json({ success: true, count: obrasParaSalvar.length });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (err: any) {
    console.error("Erro na API de Sync:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}