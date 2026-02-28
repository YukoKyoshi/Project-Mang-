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

  const clientId = process.env.ANILIST_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/anilist/callback`;
  
  // Manda o usuário para a página de permissão do AniList
  const anilistUrl = `https://anilist.co/api/v2/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;

  return NextResponse.redirect(anilistUrl);
}