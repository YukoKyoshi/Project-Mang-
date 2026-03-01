import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // ✅ NOVO: Recebemos o "tipoObra" (MANGA ou ANIME). Se não vier, assume MANGA por segurança.
    const { titulo, capitulo, statusLocal, token, acao = "SALVAR", tipoObra = "MANGA" } = await request.json();

    // ==========================================
    // 🔄 LÓGICA DE PUXAR (AniList -> Estante)
    // ==========================================
    if (acao === "PUXAR") {
      const resViewer = await fetch('https://graphql.anilist.co', { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: `query { Viewer { id } }` }) });
      const viewerId = (await resViewer.json()).data?.Viewer?.id;
      if (!viewerId) return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });

      // ✅ Usa o tipoObra dinâmico na query
      const queryList = `query ($userId: Int, $type: MediaType) { MediaListCollection(userId: $userId, type: $type) { lists { entries { progress status media { title { romaji english } coverImage { large } chapters episodes description } } } } }`;
      const resList = await fetch('https://graphql.anilist.co', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: queryList, variables: { userId: viewerId, type: tipoObra } }) });
      return NextResponse.json({ success: true, data: (await resList.json()).data?.MediaListCollection?.lists || [] });
    }

    // ==========================================
    // 🔍 BUSCA O ID DA OBRA NO ANILIST
    // ==========================================
    // ✅ Usa o tipoObra dinâmico na query de busca
    const queryBusca = `query ($search: String, $type: MediaType) { Media (search: $search, type: $type) { id } }`;
    const resBusca = await fetch('https://graphql.anilist.co', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: queryBusca, variables: { search: titulo, type: tipoObra } }) });
    const mediaId = (await resBusca.json()).data?.Media?.id;
    if (!mediaId) return NextResponse.json({ error: `Obra "${titulo}" não encontrada.` }, { status: 404 });

    // ==========================================
    // 🗑️ LÓGICA DE EXCLUSÃO (Estante -> AniList)
    // ==========================================
    if (acao === "DELETAR") {
      const resViewer = await fetch('https://graphql.anilist.co', { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: `query { Viewer { id } }` }) });
      const userId = (await resViewer.json()).data?.Viewer?.id;

      if (userId) {
        const resEntry = await fetch('https://graphql.anilist.co', { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: `query ($mediaId: Int, $userId: Int) { MediaList (mediaId: $mediaId, userId: $userId) { id } }`, variables: { mediaId, userId } }) });
        const listEntryId = (await resEntry.json()).data?.MediaList?.id;

        if (listEntryId) {
          await fetch('https://graphql.anilist.co', { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: `mutation ($id: Int) { DeleteMediaListEntry (id: $id) { deleted } }`, variables: { id: listEntryId } }) });
          return NextResponse.json({ success: true, status: "EXCLUÍDO DA LISTA" });
        }
      }
      return NextResponse.json({ success: true, status: "JÁ ESTAVA FORA DA LISTA" });
    }

    // ==========================================
    // 💾 LÓGICA DE SALVAR/ATUALIZAR
    // ==========================================
    const mapaStatus: Record<string, string> = { "Lendo": "CURRENT", "Completos": "COMPLETED", "Planejo Ler": "PLANNING", "Dropados": "DROPPED", "Pausados": "PAUSED" };
    const statusAniList = mapaStatus[statusLocal] || "CURRENT";

    const anilistRes = await fetch('https://graphql.anilist.co', { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: `mutation ($mediaId: Int, $progress: Int, $status: MediaListStatus) { SaveMediaListEntry (mediaId: $mediaId, progress: $progress, status: $status) { id status progress } }`, variables: { mediaId, progress: capitulo, status: statusAniList } }) });
    if ((await anilistRes.json()).errors) return NextResponse.json({ error: "Recusado pelo AniList." }, { status: 400 });

    return NextResponse.json({ success: true, status: statusAniList });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}