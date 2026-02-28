import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Note que NÃO EXISTE mais menção ao '@supabase/auth-helpers-nextjs' aqui.
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
    // ✅ O NOVO NOME É: createServerClient
const cookieStore = await cookies(); // Aguarda os cookies (Next.js 15+)

const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name: string) { return cookieStore.get(name)?.value },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: '', ...options })
      },
    },
  }
);

    // 3. MANDAR O USUÁRIO DE VOLTA PARA O PERFIL
    return NextResponse.redirect(new URL('/perfil', request.url));

  } catch (error) {
    console.error('Erro na autenticação AniList:', error);
    return NextResponse.json({ error: 'Falha na autenticação' }, { status: 500 });
  }
}