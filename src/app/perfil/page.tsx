"use client";

// ==========================================
// [SESSÃO 1] - IMPORTAÇÕES
// ==========================================
import { supabase } from "../supabase";
import { useEffect, useState } from "react";
import Link from "next/link";
import ColecaoTrofeus from "../components/ColecaoTrofeus";

const TEMAS = {
  verde: { bg: "bg-green-500", text: "text-green-500", border: "border-green-500", button: "bg-green-500 hover:bg-green-600", focus: "focus:border-green-500" },
  azul: { bg: "bg-blue-500", text: "text-blue-500", border: "border-blue-500", button: "bg-blue-500 hover:bg-blue-600", focus: "focus:border-blue-500" },
  roxo: { bg: "bg-purple-500", text: "text-purple-500", border: "border-purple-500", button: "bg-purple-500 hover:bg-purple-600", focus: "focus:border-purple-500" },
  laranja: { bg: "bg-orange-500", text: "text-orange-500", border: "border-orange-500", button: "bg-orange-500 hover:bg-orange-600", focus: "focus:border-orange-500" },
  custom: { bg: "bg-[var(--aura)]", text: "text-[var(--aura)]", border: "border-[var(--aura)]", button: "bg-[var(--aura)] brightness-110", focus: "focus:border-[var(--aura)]" }
};

export default function PerfilPage() {
  // ==========================================
  // [SESSÃO 2] - ESTADOS
  // ==========================================
  const [usuarioAtivo, setUsuarioAtivo] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState("STATUS");
  const [telaCheia, setTelaCheia] = useState(false);
  const [carregando, setCarregando] = useState(true);
  
  const [dadosPerfil, setDadosPerfil] = useState({ 
    nome: "", avatar: "👤", bio: "", pin: "", tema: "azul", anilist_token: null 
  });
  
  const [mangasUsuario, setMangasUsuario] = useState<any[]>([]);
  const [stats, setStats] = useState({ obras: 0, caps: 0, finais: 0 });
  const [elo, setElo] = useState({ tier: "BRONZE", cor: "from-orange-800 to-orange-500", glow: "shadow-orange-900/20" });

  // ==========================================
  // [SESSÃO 3] - SEGURANÇA E DADOS
  // ==========================================
  useEffect(() => {
    const mestre = sessionStorage.getItem("estante_acesso") || sessionStorage.getItem("acesso_mestre");
    const hunter = sessionStorage.getItem("hunter_ativo");
    if (mestre !== "true" || !hunter) { window.location.href = '/'; return; }
    setUsuarioAtivo(hunter);
  }, []);

  useEffect(() => { if (usuarioAtivo) carregarDados(); }, [usuarioAtivo]);

  async function carregarDados() {
    const { data: mangas } = await supabase.from("mangas").select("*").eq("usuario", usuarioAtivo);
    const { data: perfil } = await supabase.from("perfis").select("*").eq("nome_original", usuarioAtivo).single();

    if (mangas) {
      setMangasUsuario(mangas);
      const total = mangas.length;
      setStats({
        obras: total,
        caps: mangas.reduce((acc, m) => acc + (m.capitulo_atual || 0), 0),
        finais: mangas.filter(m => m.status === "Completos").length
      });
      
      if (total >= 100) setElo({ tier: "DIAMANTE", cor: "from-blue-400 to-indigo-600", glow: "shadow-blue-500/50 ring-blue-500/30" });
      else if (total >= 70) setElo({ tier: "PLATINA", cor: "from-emerald-400 to-cyan-500", glow: "shadow-emerald-500/40 ring-emerald-500/20" });
      else if (total >= 40) setElo({ tier: "OURO", cor: "from-yellow-400 to-amber-600", glow: "shadow-yellow-500/30 ring-yellow-500/20" });
      else if (total >= 20) setElo({ tier: "PRATA", cor: "from-zinc-400 to-zinc-100", glow: "shadow-zinc-400/20 ring-zinc-400/10" });
      else setElo({ tier: "BRONZE", cor: "from-orange-800 to-orange-500", glow: "shadow-orange-900/20 ring-orange-900/10" });
    }

    if (perfil) {
      setDadosPerfil({
        nome: perfil.nome_exibicao || usuarioAtivo!,
        avatar: perfil.avatar || "👤",
        bio: perfil.bio || "",
        pin: perfil.pin || "",
        tema: perfil.cor_tema || "azul",
        anilist_token: perfil.anilist_token || null
      });
    }
    setCarregando(false);
  }

  // ==========================================
  // [SESSÃO 4] - LÓGICA DE TROFÉUS
  // ==========================================
  const isCustom = dadosPerfil.tema?.startsWith('#');
  const aura = isCustom ? TEMAS.custom : (TEMAS[dadosPerfil.tema as keyof typeof TEMAS] || TEMAS.azul);
  
  const trofeusProps = {
    total: mangasUsuario.length,
    concluidos: mangasUsuario.filter(m => m.status === "Completos").length,
    caps: mangasUsuario.reduce((acc, m) => acc + (m.capitulo_atual || 0), 0),
    favoritos: mangasUsuario.filter(m => m.favorito === true || m.favorito === "true").length
  };

  const listaTrofeus = [
    { id: 1, nome: "Primeiro Passo", desc: "Adicionou a primeira obra", icone: "🌱", check: trofeusProps.total >= 1, cor: aura.text },
    { id: 2, nome: "Maratonista", desc: "Leu mais de 500 capítulos", icone: "🏃", check: trofeusProps.caps >= 500, cor: aura.text },
    { id: 3, nome: "Finalizador", desc: "Completou 10 séries", icone: "🏆", check: trofeusProps.concluidos >= 10, cor: aura.text },
    { id: 4, nome: "Curador de Elite", desc: "Marcar 5 favoritos", icone: "💎", check: trofeusProps.favoritos >= 5, cor: aura.text },
  ];

  if (carregando) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-black italic">CARREGANDO...</div>;

  // ==========================================
  // [SESSÃO 5] - INTERFACE
  // ==========================================
  return (
    <main className="min-h-screen bg-[#040405] flex flex-col items-center justify-center p-6 transition-all duration-500 overflow-hidden relative">
      
      {/* Controles Superiores Fixos no Topo */}
      <div className="fixed top-0 left-0 w-full p-6 md:p-10 flex justify-between items-center z-[100] pointer-events-none">
        <Link href="/" className="pointer-events-auto text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors bg-black/50 px-4 py-2 rounded-xl backdrop-blur-md">
          ← Voltar
        </Link>
        <button 
          onClick={() => setTelaCheia(!telaCheia)}
          className="pointer-events-auto text-[10px] font-black uppercase tracking-widest bg-zinc-900/90 backdrop-blur-md px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white transition-all shadow-xl"
        >
          {telaCheia ? "⊙ Vista Central" : "⛶ Tela Cheia"}
        </button>
      </div>

      {/* 💳 CARD DO PERFIL */}
      <div 
        className={`bg-[#0e0e11] rounded-[3rem] p-10 mt-12 md:mt-0 border border-white/5 transition-all duration-700 relative flex flex-col items-center shadow-2xl ${elo.glow} ring-2
          ${telaCheia ? 'w-full max-w-6xl' : 'w-full max-w-[520px]'}`}
      >
        
        {/* Identidade */}
        <div className={`w-24 h-24 bg-zinc-950 rounded-[1.5rem] flex items-center justify-center text-5xl border-2 ${aura.border} shadow-lg mb-4`}>
          {dadosPerfil.avatar}
        </div>
        <h1 className="text-3xl font-black text-white uppercase tracking-wider mb-1">{dadosPerfil.nome}</h1>
        <p className={`text-[12px] font-black bg-gradient-to-r ${elo.cor} bg-clip-text text-transparent uppercase tracking-[0.3em] mb-8`}>RANK: {elo.tier}</p>

        {/* Abas */}
        <div className="flex gap-12 border-b border-zinc-800/50 w-full justify-center pb-4 mb-8 relative z-20">
          <button onClick={() => setAbaAtiva("STATUS")} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all ${abaAtiva === "STATUS" ? aura.text : 'text-zinc-600'}`}>
            HUNTER STATUS
          </button>
          <button onClick={() => setAbaAtiva("TROFÉUS")} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all ${abaAtiva === "TROFÉUS" ? aura.text : 'text-zinc-600'}`}>
            TROFÉUS
          </button>
        </div>

        {/* Área de Conteúdo Dinâmico com Animação Fluida (CSS Grid Trick) */}
        <div className="w-full grid" style={{ gridTemplateAreas: "'conteudo'" }}>
          
          {/* Aba: STATUS */}
          {abaAtiva === "STATUS" && (
            <div className="w-full space-y-8 animate-in fade-in slide-in-from-left-4 duration-500" style={{ gridArea: "conteudo" }}>
               <div className="grid grid-cols-3 gap-4">
                  {[{ label: "OBRAS", val: stats.obras }, { label: "CAPS", val: stats.caps }, { label: "FINAIS", val: stats.finais }].map(s => (
                    <div key={s.label} className="bg-black/40 border border-white/5 rounded-2xl py-6 flex flex-col items-center">
                      <span className="text-2xl font-black text-white italic">{s.val}</span>
                      <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mt-2">{s.label}</span>
                    </div>
                  ))}
               </div>

               <div className="w-full pb-2">
                  {dadosPerfil.anilist_token ? (
                    <div className="bg-green-500/5 border border-green-500/20 rounded-xl py-4 flex justify-center items-center gap-2 text-green-500 text-[9px] font-black uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Sincronizado
                    </div>
                  ) : (
                    <button onClick={() => window.location.href = '/api/auth/anilist'} className="w-full bg-[#02a9ff] hover:bg-[#008dff] text-white rounded-xl py-4 text-[10px] font-black uppercase tracking-widest flex justify-center items-center gap-2">
                      <img src="https://anilist.co/img/icons/icon.svg" className="w-3 h-3 invert" alt="" /> Conectar AniList
                    </button>
                  )}
               </div>
            </div>
          )}

          {/* Aba: TROFÉUS */}
          {abaAtiva === "TROFÉUS" && (
            <div className="w-full animate-in fade-in slide-in-from-right-4 duration-500 overflow-x-auto pb-6 custom-scrollbar" style={{ gridArea: "conteudo" }}>
              {/* O 'w-max' salva os troféus de serem esmagados */}
              <div className="w-max min-w-full px-2 flex justify-center">
                <ColecaoTrofeus trofeusAtivos={listaTrofeus} aura={aura} />
              </div>
            </div>
          )}

        </div>

        {/* Logout */}
        <button 
          onClick={() => { sessionStorage.removeItem('hunter_ativo'); window.location.href = '/'; }}
          className="w-full py-4 mt-8 rounded-xl border border-red-500/20 text-[10px] font-black uppercase tracking-[0.2em] text-red-500 hover:bg-red-500 hover:text-white transition-all relative z-20"
        >
          SAIR DO PERFIL
        </button>

      </div>
    </main>
  );
}