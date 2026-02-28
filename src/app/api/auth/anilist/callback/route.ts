import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// [SESSÃO: CALLBACK DE AUTENTICAÇÃO ANILIST - VERSÃO NEXT.JS 15+]
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${origin}/perfil?error=no_code`);
  }

  try {
    // 🎯 1. TROCAR O CÓDIGO PELO TOKEN REAL NO ANILIST
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

    const authData = await res.json();
    if (authData.error) throw new Error(authData.error_description || 'Erro ao obter Token');

    const accessToken = authData.access_token;

    // 🎯 2. CONFIGURAR CLIENTE SUPABASE (Aguardando os Cookies - Next.js 15)
    // Aqui está a correção para os erros de 'get' e 'set'
    const cookieStore = await cookies(); 
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // 🎯 3. IDENTIFICAR USUÁRIO LOGADO E SALVAR O TOKEN
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error: dbError } = await supabase
        .from('perfis')
        .update({ anilist_token: accessToken })
        .eq('id', user.id);

      if (dbError) throw dbError;
    }

    return NextResponse.redirect(`${origin}/perfil?success=connected`);

  } catch (error: any) {
    console.error('❌ Erro Crítico na Integração:', error.message);
    return NextResponse.redirect(`${origin}/perfil?error=integration_failed`);
  }
}