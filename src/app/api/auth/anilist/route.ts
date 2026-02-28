import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hunter = searchParams.get('hunter');

  // Se alguém tentar acessar a rota direto sem escolher o perfil, nós bloqueamos.
  if (!hunter) {
    return NextResponse.json({ error: "Hunter não identificado. Faça login no perfil primeiro." }, { status: 400 });
  }

  // Cria o Crachá Temporário (Cookie) que dura 10 minutos
  const cookieStore = await cookies();
  cookieStore.set('hunter_auth_target', hunter, { 
    maxAge: 60 * 10, // 10 minutos
    path: '/',
    httpOnly: true // Segurança máxima
  });

// ✅ [NOVO] TRAVA DE SEGURANÇA E HIGIENIZAÇÃO DA URL
  const clientId = process.env.ANILIST_CLIENT_ID;
  const clientSecret = process.env.ANILIST_CLIENT_SECRET;
  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  // Remove a barra final do link do site, caso você tenha salvo com ela na Vercel
  if (siteUrl.endsWith('/')) {
    siteUrl = siteUrl.slice(0, -1);
  }

  // 🛡️ Alerta de Segurança: Evita enviar para o AniList se as chaves sumirem
  if (!clientId || !clientSecret || !siteUrl) {
    console.error("ERRO CRÍTICO: Chaves do AniList ou URL do site faltando nas variáveis de ambiente!");
    return NextResponse.json({ 
      error: "Falha de configuração no servidor. Verifique o Client ID, Secret e Site URL na Vercel." 
    }, { status: 500 });
  }

  const redirectUri = `${siteUrl}/api/auth/anilist/callback`;
  
  // Manda o usuário para a página de permissão do AniList
  const anilistUrl = `https://anilist.co/api/v2/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;

  return NextResponse.redirect(anilistUrl);
}