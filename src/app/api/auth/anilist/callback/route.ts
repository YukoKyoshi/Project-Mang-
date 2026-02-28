import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  const cookieStore = await cookies();
  const hunterAlvo = cookieStore.get('hunter_auth_target')?.value;

  // Se não tem código ou não sabemos de qual Hunter é, joga de volta pro início
  if (!code || !hunterAlvo) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 1. Troca o 'code' pelo 'Token de Acesso Real' na API do AniList
  const anilistResponse = await fetch('https://anilist.co/api/v2/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.ANILIST_CLIENT_ID,
      client_secret: process.env.ANILIST_CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/anilist/callback`,
      code,
    }),
  });

  const anilistData = await anilistResponse.json();

  if (anilistData.access_token) {
    // 2. Abre o cliente do Supabase
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }) },
          remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: '', ...options }) },
        },
      }
    );

    // 3. Salva o Token APENAS no perfil do Hunter que solicitou
    await supabase
      .from('perfis')
      .update({ anilist_token: anilistData.access_token })
      .eq('nome_original', hunterAlvo);

    // 4. Limpa o crachá temporário por segurança
    cookieStore.delete('hunter_auth_target');
  }

  // Manda o Hunter de volta para a sua página de perfil para ver o sucesso
  return NextResponse.redirect(new URL('/perfil', request.url));
}