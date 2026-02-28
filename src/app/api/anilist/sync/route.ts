import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { titulo, capitulo, statusLocal, token } = await request.json();

    // 1. Busca o ID oficial do mangá no AniList
    const queryBusca = `query ($search: String) { Media (search: $search, type: MANGA) { id } }`;
    const resBusca = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query: queryBusca, variables: { search: titulo } })
    });
    
    const dataBusca = await resBusca.json();
    const mediaId = dataBusca.data?.Media?.id;

    if (!mediaId) {
      return NextResponse.json({ error: `Mangá "${titulo}" não encontrado no AniList.` }, { status: 404 });
    }

    // 2. Tradutor de Status
    const mapaStatus: Record<string, string> = {
      "Lendo": "CURRENT",
      "Completos": "COMPLETED",
      "Planejo Ler": "PLANNING",
      "Dropados": "DROPPED"
    };
    const statusAniList = mapaStatus[statusLocal] || "CURRENT";

    // 3. Atualiza na conta do AniList (Sem regras de CORS porque estamos no backend!)
    const mutationUpdate = `
      mutation ($mediaId: Int, $progress: Int, $status: MediaListStatus) {
        SaveMediaListEntry (mediaId: $mediaId, progress: $progress, status: $status) {
          id
          status
          progress
        }
      }
    `;

    const anilistRes = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`, 
        'Content-Type': 'application/json', 
        'Accept': 'application/json' 
      },
      body: JSON.stringify({ query: mutationUpdate, variables: { mediaId, progress: capitulo, status: statusAniList } })
    });

    const anilistData = await anilistRes.json();

    if (anilistData.errors) {
        console.error("Erro da API do AniList:", anilistData.errors);
        return NextResponse.json({ error: "O AniList recusou a atualização." }, { status: 400 });
    }

    return NextResponse.json({ success: true, status: statusAniList });
  } catch (error) {
    console.error("Erro fatal no servidor:", error);
    return NextResponse.json({ error: "Erro interno na ponte com o AniList." }, { status: 500 });
  }
}