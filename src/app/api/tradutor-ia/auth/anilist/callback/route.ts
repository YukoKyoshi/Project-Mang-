import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code'); // O código temporário do AniList

  if (!code) return NextResponse.json({ error: 'Código não fornecido' }, { status: 400 });

  try {
    // 1. TROCAR O CÓDIGO PELO TOKEN
    const res = await fetch('https://anilist.co/api/v2/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.ANILIST_CLIENT_ID,
        client_secret: process.env.ANILIST_CLIENT_SECRET,
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/anilist/callback`,
        code: code,
      }),
    });

    const data = await res.json();
    const accessToken = data.access_token;

    // 2. SALVAR NO SUPABASE (Vinculando ao usuário logado)
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from('perfis')
        .update({ anilist_token: accessToken })
        .eq('id', user.id);
    }

    // 3. MANDAR O USUÁRIO DE VOLTA PARA O PERFIL
    return NextResponse.redirect(new URL('/perfil', request.url));

  } catch (error) {
    console.error('Erro na autenticação AniList:', error);
    return NextResponse.json({ error: 'Falha na autenticação' }, { status: 500 });
  }
}