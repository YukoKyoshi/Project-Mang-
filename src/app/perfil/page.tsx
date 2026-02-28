"use client";

// ==========================================
// [SESSÃO 1] - IMPORTAÇÕES E CONFIGURAÇÕES
// ==========================================
import { supabase } from "../supabase";
import { useEffect, useState } from "react";
import Link from "next/link";
import ColecaoTrofeus from "../components/ColecaoTrofeus";
import MuralFavoritos from "../components/MuralFavoritos";

const TEMAS = {
  verde: { nome: "Verde Néon", bg: "bg-green-500", bgActive: "bg-green-600", text: "text-green-500", border: "border-green-500", focus: "focus:border-green-500 focus:ring-green-500/20", shadow: "shadow-green-500/40" },
  azul: { nome: "Azul Elétrico", bg: "bg-blue-500", bgActive: "bg-blue-600", text: "text-blue-500", border: "border-blue-500", focus: "focus:border-blue-500 focus:ring-blue-500/20", shadow: "shadow-blue-500/40" },
  roxo: { nome: "Roxo Carmesim", bg: "bg-purple-500", bgActive: "bg-purple-600", text: "text-purple-500", border: "border-purple-500", focus: "focus:border-purple-500 focus:ring-purple-500/20", shadow: "shadow-purple-500/40" },
  laranja: { nome: "Laranja Outono", bg: "bg-orange-500", bgActive: "bg-orange-600", text: "text-orange-500", border: "border-orange-500", focus: "focus:border-orange-500 focus:ring-orange-500/20", shadow: "shadow-orange-500/40" },
  custom: { nome: "Cor Livre", bg: "bg-[var(--aura)]", bgActive: "bg-[var(--aura)] brightness-110", text: "text-[var(--aura)]", border: "border-[var(--aura)]", focus: "focus:border-[var(--aura)] focus:ring-[var(--aura)]", shadow: "shadow-[0_0_15px_var(--aura)]" }
};

export default function PerfilPage() {
  // ==========================================
  // [SESSÃO 2] - ESTADOS (STATES)
  // ==========================================
  const [usuarioAtivo, setUsuarioAtivo] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState(false);
  
  const [dadosPerfil, setDadosPerfil] = useState({ 
    nome: "", avatar: "👤", bio: "", pin: "", tema: "verde", anilist_token: null 
  });
  
  const [mangasUsuario, setMangasUsuario] = useState<any[]>([]);
  const [elo, setElo] = useState({ tier: "Bronze", sub: "IV", cor: "from-orange-700 to-orange-400", moldura: "ring-orange-900 shadow-orange-900/10 ring-1", borda: "border-orange-900" });

  // ==========================================
  // [SESSÃO 3] - LÓGICA DE RANKING
  // ==========================================
  const definirElo = (total: number) => {
    if (total >= 200) return { tier: "DIVINO", sub: "TOP", cor: "from-white to-yellow-200", moldura: "ring-yellow-200 shadow-yellow-500/50 ring-8", borda: "border-yellow-100" };
    if (total >= 150) return { tier: "IMORTAL", sub: "I", cor: "from-purple-600 to-pink-500", moldura: "ring-purple-500 shadow-purple-500/40 ring-4", borda: "border-purple-400" };
    if (total >= 100) return { tier: "MESTRE", sub: "I", cor: "from-red-600 to-orange-600", moldura: "ring-red-600 shadow-red-500/40 ring-4", borda: "border-red-500" };
    if (total >= 75) return { tier: "DIAMANTE", sub: "II", cor: "from-blue-400 to-indigo-600", moldura: "ring-blue-500 shadow-blue-500/40 ring-4", borda: "border-blue-400" };
    if (total >= 50) return { tier: "PLATINA", sub: "III", cor: "from-emerald-400 to-cyan-500", moldura: "ring-emerald-500 shadow-emerald-500/30 ring-2", borda: "border-emerald-500" };
    if (total >= 30) return { tier: "OURO", sub: "I", cor: "from-yellow-400 to-amber-600", moldura: "ring-yellow-500 shadow-yellow-500/20 ring-2", borda: "border-yellow-600" };
    if (total >= 15) return { tier: "PRATA", sub: "II", cor: "from-zinc-400 to-zinc-100", moldura: "ring-zinc-300 shadow-zinc-500/20 ring-2", borda: "border-zinc-400" };
    return { tier: "BRONZE", sub: "IV", cor: "from-orange-800 to-orange-500", moldura: "ring-orange-900 shadow-orange-900/10 ring-1", borda: "border-orange-900" };
  };

  // ==========================================
  // [SESSÃO 4] - GUARDIÃO DE SEGURANÇA E CARREGAMENTO
  // ==========================================
  useEffect(() => {
    // 🛡️ SUBTÍTULO: VERIFICAÇÃO DE ACESSO
    const acessoMestre = sessionStorage.getItem('estante_acesso');
    const hunterLogado = sessionStorage.getItem('hunter_ativo');

    // Se não houver senha mestre OU não houver um perfil escolhido, volta para o início
    if (acessoMestre !== 'true' || !hunterLogado) {
      window.location.href = '/';
      return;
    }

    setUsuarioAtivo(hunterLogado);
  }, []);

  useEffect(() => {
    if (usuarioAtivo) carregarDados();
  }, [usuarioAtivo]);

  async function carregarDados() {
    setCarregando(true);
    try {
      // 🎯 Busca real dos mangás do usuário logado
      const { data: mangas } = await supabase.from("mangas").select("*").eq("usuario", usuarioAtivo);
      const { data: perfil } = await supabase.from("perfis").select("*").eq("nome_original", usuarioAtivo).single();

      if (mangas) {
        setElo(definirElo(mangas.length));
        setMangasUsuario(mangas);
      }
      if (perfil) {
        setDadosPerfil({ 
          nome: perfil.nome_exibicao || usuarioAtivo!, 
          avatar: perfil.avatar || "👤", 
          bio: perfil.bio || "Sem bio ainda.", 
          pin: perfil.pin || "",
          tema: perfil.cor_tema || "verde",
          anilist_token: perfil.anilist_token || null
        });
      }
    } finally {
      setCarregando(false);
    }
  }

  // ==========================================
  // [SESSÃO 5] - AÇÕES DO PERFIL
  // ==========================================
  async function salvarEdicao() {
    const { error } = await supabase.from("perfis").upsert({ 
      nome_original: usuarioAtivo, 
      nome_exibicao: dadosPerfil.nome, 
      avatar: dadosPerfil.avatar, 
      bio: dadosPerfil.bio, 
      pin: dadosPerfil.pin,
      cor_tema: dadosPerfil.tema 
    }, { onConflict: 'nome_original' });
    
    if (!error) { setEditando(false); carregarDados(); } else alert("❌ Erro ao guardar.");
  }

  if (carregando) return <div className="min-h-screen bg-[#040405] flex items-center justify-center text-white font-black italic uppercase tracking-widest animate-pulse">Sincronizando Dados Hunter...</div>;

  const isCustom = dadosPerfil.tema?.startsWith('#');
  const aura = isCustom ? TEMAS.custom : (TEMAS[dadosPerfil.tema as keyof typeof TEMAS] || TEMAS.verde);

  return (
    <main 
      className="min-h-screen bg-[#040405] text-[#e5e5e5] p-6 md:p-20 font-sans"
      style={isCustom ? { '--aura': dadosPerfil.tema } as React.CSSProperties : {}} 
    >
      {/* --- Navegação Superior --- */}
      <nav className="max-w-6xl mx-auto mb-16 flex justify-start relative z-50">
        <Link href="/" className={`px-8 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:${aura.border} transition-all text-zinc-500 hover:text-white flex items-center gap-2`}>
          ← Voltar para Estante
        </Link>
      </nav>

      {/* --- Cabeçalho de Perfil (Unificado) --- */}
      <section className={`max-w-6xl mx-auto grid md:grid-cols-[auto_1fr_auto] gap-12 items-center mb-20 bg-[#0e0e11] p-10 md:p-14 rounded-[4rem] border border-white/5 relative ${aura.shadow} transition-shadow duration-700`}>
        <div className="relative">
          <div className={`w-56 h-56 bg-zinc-950 rounded-[4rem] flex items-center justify-center text-8xl shadow-2xl transition-all duration-700 ring-offset-8 ring-offset-[#0e0e11] ${elo.moldura} ${elo.borda} border-4`}>{dadosPerfil.avatar}</div>
          {editando && ( <div className="absolute inset-0 bg-black/60 rounded-[4rem] flex items-center justify-center z-10 backdrop-blur-sm"><input className="w-full bg-transparent text-center text-4xl outline-none border-b-2 border-dashed border-white/30 focus:border-white transition-colors" value={dadosPerfil.avatar} onChange={(e) => setDadosPerfil({...dadosPerfil, avatar: e.target.value})} /></div> )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            {editando ? ( <input className={`bg-zinc-950 border border-white/10 ${aura.focus} rounded-2xl px-5 py-2 text-4xl font-black outline-none w-full text-white transition-colors`} value={dadosPerfil.nome} onChange={(e) => setDadosPerfil({...dadosPerfil, nome: e.target.value})} /> ) : ( <h1 className="text-6xl font-black tracking-tighter uppercase italic text-white drop-shadow-lg">{dadosPerfil.nome}</h1> )}
          </div>
          {editando ? (
             <div className="flex flex-col gap-4">
                <textarea className={`w-full bg-zinc-950 border border-zinc-800 ${aura.focus} rounded-2xl p-4 text-sm text-zinc-400 outline-none h-20 resize-none transition-colors`} value={dadosPerfil.bio} onChange={(e) => setDadosPerfil({...dadosPerfil, bio: e.target.value})} />
                <div className="flex flex-col xl:flex-row gap-4">
                  <div className="flex items-center gap-4 bg-red-950/30 border border-red-900/50 p-4 rounded-2xl w-fit">
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">🔒 PIN:</p>
                    <input type="password" maxLength={4} placeholder="0000" className="bg-zinc-950 border border-red-500 rounded-xl px-4 py-2 text-lg font-black outline-none w-24 text-center tracking-[0.3em] text-white focus:ring-2 focus:ring-red-500" value={dadosPerfil.pin} onChange={(e) => setDadosPerfil({...dadosPerfil, pin: e.target.value.replace(/\D/g, '')})} />
                  </div>
                </div>
             </div>
          ) : ( <p className="text-zinc-500 text-base max-w-lg font-medium italic opacity-70">"{dadosPerfil.bio}"</p> )}
          
          <button onClick={() => editando ? salvarEdicao() : setEditando(true)} className={`px-6 py-2 bg-zinc-800/50 hover:bg-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/5 transition-all mt-2`}>
            {editando ? "💾 Aplicar Mudanças" : "✏️ Customizar Info"}
          </button>
        </div>

        <div className="flex flex-col items-center justify-center p-10 bg-black/40 rounded-[3.5rem] border border-white/5 min-w-[220px] shadow-inner relative">
           <div className={`absolute -inset-2 bg-gradient-to-t ${elo.cor} opacity-5 blur-2xl`}></div>
           <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em] mb-4">Hunter Tier</p>
           <span className={`text-5xl font-black italic tracking-tighter bg-gradient-to-br ${elo.cor} bg-clip-text text-transparent`}>{elo.tier}</span>
           <span className="text-zinc-500 font-black text-xl mt-2 tracking-[0.4em] opacity-50">{elo.sub}</span>
        </div>
      </section>

      {/* --- Grid de Estatísticas (Lendo dados reais do Supabase) --- */}
      <section className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
        {[
          { label: "Obras", val: mangasUsuario.length, color: "text-white" },
          { label: "Capítulos", val: mangasUsuario.reduce((a, b) => a + (b.capitulo_atual || 0), 0), color: "text-white" },
          { label: "Concluidos", val: mangasUsuario.filter(m => m.status === "Completos").length, color: aura.text },
          { label: "Favoritos", val: mangasUsuario.filter(m => m.favorito === true || m.favorito === "true").length, color: "text-yellow-500" }
        ].map(s => (
          <div key={s.label} className={`bg-[#0e0e11] p-12 rounded-[3.5rem] border border-white/5 text-center shadow-2xl hover:${aura.shadow} transition-shadow duration-500`}>
            <p className="text-[11px] font-black text-zinc-600 uppercase mb-4 tracking-widest">{s.label}</p>
            <span className={`text-6xl font-black ${s.color} tracking-tighter italic`}>{s.val}</span>
          </div>
        ))}
      </section>

      {/* --- Integração AniList --- */}
      <section className="max-w-6xl mx-auto mb-20">
        <div className="bg-[#0e0e11] p-10 rounded-[3.5rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="flex flex-col">
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Integração AniList</h3>
            <p className="text-zinc-500 text-sm font-medium">Sincronize seu progresso de leitura automaticamente.</p>
          </div>
          
          {dadosPerfil.anilist_token ? (
            <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 px-6 py-3 rounded-2xl">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-500 font-black text-[10px] uppercase tracking-widest">Sincronização Ativa</span>
            </div>
          ) : (
            <button onClick={() => window.location.href = '/api/auth/anilist'} className="bg-[#02a9ff] hover:bg-[#008dff] text-white font-black uppercase tracking-widest text-[10px] px-8 py-4 rounded-2xl transition-all shadow-lg flex items-center gap-2">
              <img src="https://anilist.co/img/icons/icon.svg" className="w-4 h-4 invert" alt="" />
              Conectar com AniList
            </button>
          )}
        </div>
      </section>

      <MuralFavoritos mangasUsuario={mangasUsuario} aura={aura} />
    </main>
  );
}