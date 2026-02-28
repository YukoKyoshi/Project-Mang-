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
  
  // -- Subseção: Identidade e Sessão
  const [usuarioAtivo, setUsuarioAtivo] = useState("Meu Perfil");
  const [editando, setEditando] = useState(false);
  
  // -- Subseção: Dados do Perfil (Incluindo AniList)
  const [dadosPerfil, setDadosPerfil] = useState({ 
    nome: "", avatar: "👤", bio: "", pin: "", tema: "verde", 
    anilist_token: null // Novo campo para rastrear conexão
  });
  
  // -- Subseção: Listas e Ranking
  const [mangasUsuario, setMangasUsuario] = useState<any[]>([]);
  const [todosPerfis, setTodosPerfis] = useState<any[]>([]);
  const [elo, setElo] = useState({ tier: "Bronze", sub: "IV", cor: "from-orange-700 to-orange-400", moldura: "ring-orange-900 shadow-orange-900/10 ring-1", borda: "border-orange-900" });

  // -- Subseção: Segurança (PIN)
  const [perfilAlvoParaBloqueio, setPerfilAlvoParaBloqueio] = useState<string | null>(null);
  const [pinDigitado, setPinDigitado] = useState("");

  // ==========================================
  // [SESSÃO 3] - LÓGICA DE RANKING E TROFÉUS
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

  const calcularTrofeus = (mangas: any[], auraAtual: any) => {
    const total = mangas.length;
    const concluidos = mangas.filter(m => m.status === "Completos").length;
    const caps = mangas.reduce((acc, m) => acc + (m.capitulo_atual || 0), 0);
    const favoritos = mangas.filter(m => m.favorito === true || m.favorito === "true").length;
    return [
      { id: 1, nome: "Primeiro Passo", desc: "Adicionou a primeira obra", icone: "🌱", check: total >= 1, cor: auraAtual.text },
      { id: 2, nome: "Maratonista", desc: "Leu mais de 500 capítulos", icone: "🏃", check: caps >= 500, cor: auraAtual.text },
      { id: 3, nome: "Finalizador", desc: "Completou 10 séries", icone: "🏆", check: concluidos >= 10, cor: auraAtual.text },
      { id: 4, nome: "Curador de Elite", desc: "Marcar 5 favoritos manuais", icone: "💎", check: favoritos >= 5, cor: auraAtual.text },
      { id: 5, nome: "Bibliotecário", desc: "Ter 50 obras na estante", icone: "📚", check: total >= 50, cor: auraAtual.text },
      { id: 6, nome: "Viciado", desc: "Passar dos 2000 capítulos", icone: "⚡", check: caps >= 2000, cor: auraAtual.text },
    ];
  };

  // ==========================================
  // [SESSÃO 4] - COMUNICAÇÃO COM BANCO DE DADOS
  // ==========================================

  useEffect(() => {
    const usuarioSalvo = sessionStorage.getItem('hunter_ativo');
    if (usuarioSalvo) setUsuarioAtivo(usuarioSalvo);
  }, []);

  async function carregarDados() {
    const { data: mangas } = await supabase.from("mangas").select("*").eq("usuario", usuarioAtivo);
    const { data: perfil } = await supabase.from("perfis").select("*").eq("nome_original", usuarioAtivo).single();
    const { data: todos } = await supabase.from("perfis").select("*");

    if (todos) setTodosPerfis(todos);
    if (mangas) {
      setElo(definirElo(mangas.length));
      setMangasUsuario(mangas);
    }
    if (perfil) {
      setDadosPerfil({ 
        nome: perfil.nome_exibicao || usuarioAtivo, 
        avatar: perfil.avatar || "👤", 
        bio: perfil.bio || "Sem bio ainda.", 
        pin: perfil.pin || "",
        tema: perfil.cor_tema || "verde",
        anilist_token: perfil.anilist_token || null // Carregando o token do AniList
      });
    }
  }

  useEffect(() => { carregarDados(); }, [usuarioAtivo]);

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

  // ==========================================
  // [SESSÃO 5] - GESTÃO DE ACESSO (PIN)
  // ==========================================

  function tentarMudarPerfil(nomeOriginal: string) {
    if (nomeOriginal === usuarioAtivo) return;
    const info = todosPerfis.find(p => p.nome_original === nomeOriginal);
    if (info && info.pin && info.pin.trim() !== "") {
      setPerfilAlvoParaBloqueio(nomeOriginal);
      setPinDigitado("");
    } else {
      setUsuarioAtivo(nomeOriginal);
      sessionStorage.setItem('hunter_ativo', nomeOriginal);
    }
  }

  function confirmarAcessoPin() {
    const info = todosPerfis.find(p => p.nome_original === perfilAlvoParaBloqueio);
    if (info && info.pin === pinDigitado) {
      setUsuarioAtivo(perfilAlvoParaBloqueio!);
      sessionStorage.setItem('hunter_ativo', perfilAlvoParaBloqueio!);
      setPerfilAlvoParaBloqueio(null);
      setPinDigitado("");
    } else {
      alert("❌ PIN Incorreto! Acesso negado.");
      setPinDigitado("");
    }
  }

  // ==========================================
  // [SESSÃO 6] - PREPARAÇÃO VISUAL (TEMAS)
  // ==========================================
  const isCustom = dadosPerfil.tema?.startsWith('#');
  const aura = isCustom ? TEMAS.custom : (TEMAS[dadosPerfil.tema as keyof typeof TEMAS] || TEMAS.verde);
  const trofeusAtivos = calcularTrofeus(mangasUsuario, aura);

  // ==========================================
  // [SESSÃO 7] - RENDERIZAÇÃO DA INTERFACE (UI)
  // ==========================================
  return (
    <main 
      className={`min-h-screen bg-[#040405] text-[#e5e5e5] p-6 md:p-20 font-sans`}
      style={isCustom ? { '--aura': dadosPerfil.tema } as React.CSSProperties : {}} 
    >
      
      {/* --- Subseção: Modal de PIN (Bloqueio) --- */}
      {perfilAlvoParaBloqueio && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#111114] border border-zinc-800 p-10 rounded-[3rem] shadow-2xl flex flex-col items-center max-w-sm w-full relative">
            <button onClick={() => setPerfilAlvoParaBloqueio(null)} className="absolute top-6 right-6 text-zinc-500 hover:text-white">✕</button>
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-xl font-black text-white uppercase tracking-widest mb-2 text-center">Acesso Restrito</h2>
            <input autoFocus type="password" maxLength={4} className={`bg-zinc-950 border border-zinc-700 ${aura.focus} rounded-2xl w-full py-4 text-center text-3xl font-black tracking-[1em] text-white outline-none mb-6 shadow-inner`} value={pinDigitado} onChange={(e) => setPinDigitado(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => e.key === 'Enter' && confirmarAcessoPin()} />
            <button onClick={confirmarAcessoPin} className={`w-full ${aura.bgActive} text-white font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-lg`}>Desbloquear</button>
          </div>
        </div>
      )}

      {/* --- Subseção: Navegação e Perfis --- */}
      <nav className="max-w-6xl mx-auto mb-16 flex flex-col md:flex-row justify-between items-center gap-6 relative z-50">
        <Link href="/" className={`px-6 py-2 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:${aura.border} transition-all text-zinc-500 hover:text-white`}>
          ← Voltar para Estante
        </Link>
        <div className="flex bg-zinc-900/40 p-1.5 rounded-2xl border border-zinc-800 backdrop-blur-md">
          {["Meu Perfil", "Amigo 1", "Amigo 2"].map(u => {
            const info = todosPerfis.find(p => p.nome_original === u) || { nome_exibicao: u };
            return (
              <button key={u} onClick={() => tentarMudarPerfil(u)} className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-1 ${usuarioAtivo === u ? `${aura.bgActive} text-white shadow-xl scale-105` : 'text-zinc-500 hover:text-zinc-300'}`}>
                {info.nome_exibicao.toUpperCase()}
                {info.pin && info.pin !== "" && usuarioAtivo !== u && <span className="text-red-500">🔒</span>}
              </button>
            )
          })}
        </div>
      </nav>

      {/* --- Subseção: Cabeçalho do Perfil (Avatar + Info) --- */}
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
                  
                  <div className="flex flex-col justify-center gap-2 bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl w-fit">
                    <p className={`text-[10px] font-bold ${aura.text} uppercase tracking-widest transition-colors`}>🎨 Aura do Perfil:</p>
                    <div className="flex gap-3 items-center">
                      {Object.keys(TEMAS).map(chave => {
                        if (chave === 'custom') {
                          return (
                            <div key={chave} className="relative w-8 h-8 flex items-center justify-center group" title="Escolher Cor Livre">
                              <input
                                type="color"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                value={isCustom ? dadosPerfil.tema : '#ffffff'}
                                onChange={(e) => setDadosPerfil({...dadosPerfil, tema: e.target.value})}
                              />
                              <div className={`w-8 h-8 rounded-full border-2 border-dashed ${isCustom ? 'ring-4 ring-white shadow-lg scale-110 border-transparent' : 'border-zinc-500 opacity-50 group-hover:opacity-100'} transition-all duration-300 flex items-center justify-center`} style={{ backgroundColor: isCustom ? dadosPerfil.tema : 'transparent' }}>
                                {!isCustom && <span className="text-zinc-500 text-[10px] text-center mb-0.5">➕</span>}
                              </div>
                            </div>
                          );
                        }
                        return (
                          <button 
                            key={chave} 
                            onClick={() => setDadosPerfil({...dadosPerfil, tema: chave})}
                            className={`w-8 h-8 rounded-full ${TEMAS[chave as keyof typeof TEMAS].bg} ${dadosPerfil.tema === chave ? 'ring-4 ring-white shadow-lg scale-110' : 'opacity-30 hover:opacity-100 grayscale hover:grayscale-0'} transition-all duration-300`}
                            title={TEMAS[chave as keyof typeof TEMAS].nome}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
             </div>
          ) : ( <p className="text-zinc-500 text-base max-w-lg font-medium italic opacity-70">"{dadosPerfil.bio}"</p> )}
          
          <button onClick={() => editando ? salvarEdicao() : setEditando(true)} className={`px-6 py-2 bg-zinc-800/50 hover:bg-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/5 transition-all mt-2`}>
            {editando ? "💾 Aplicar Mudanças" : "✏️ Customizar Info"}
          </button>
        </div>

        {/* --- Subseção: Tier Visual (Elo) --- */}
        <div className="flex flex-col items-center justify-center p-10 bg-black/40 rounded-[3.5rem] border border-white/5 min-w-[220px] shadow-inner relative group">
           <div className={`absolute -inset-2 bg-gradient-to-t ${elo.cor} opacity-5 blur-2xl`}></div>
           <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em] mb-4">Hunter Tier</p>
           <span className={`text-5xl font-black italic tracking-tighter bg-gradient-to-br ${elo.cor} bg-clip-text text-transparent`}>{elo.tier}</span>
           <span className="text-zinc-500 font-black text-xl mt-2 tracking-[0.4em] opacity-50">{elo.sub}</span>
        </div>
      </section>

      {/* --- Subseção: Grid de Estatísticas --- */}
      <section className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
        {[
          { label: "Obras", val: mangasUsuario.length, color: "text-white" },
          { label: "Capítulos", val: mangasUsuario.reduce((a, b) => a + (b.capitulo_atual || 0), 0), color: "text-white" },
          { label: "Concluidos", val: mangasUsuario.filter(m => m.status === "Completos").length, color: aura.text },
          { label: "Favoritos", val: mangasUsuario.filter(m => m.favorito === true || m.favorito === "true").length, color: "text-yellow-500" }
        ].map(s => (
          <div key={s.label} className={`bg-[#0e0e11] p-12 rounded-[3.5rem] border border-white/5 text-center shadow-2xl hover:${aura.shadow} transition-shadow duration-500`}>
            <p className="text-[11px] font-black text-zinc-600 uppercase mb-4 tracking-widest">{s.label}</p>
            <span className={`text-6xl font-black ${s.color} tracking-tighter italic transition-colors`}>{s.val}</span>
          </div>
        ))}
      </section>

{/* ==========================================
          [TESTE] - SUBSEÇÃO: INTEGRAÇÕES (FORÇADO)
          ========================================== */}
      <section className="max-w-6xl mx-auto mb-20">
        <div className="bg-[#0e0e11] p-10 rounded-[3.5rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="flex flex-col">
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Integração AniList</h3>
            <p className="text-zinc-500 text-sm font-medium">Sincronize seu progresso de leitura automaticamente com a sua conta externa.</p>
          </div>
          
          {/* Botão Forçado para Teste */}
          <button 
            onClick={() => window.location.href = '/api/auth/anilist'}
            className="bg-[#02a9ff] hover:bg-[#008dff] text-white font-black uppercase tracking-widest text-[10px] px-8 py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2"
          >
            <img src="https://anilist.co/img/icons/icon.svg" className="w-4 h-4 invert" alt="" />
            Conectar com AniList
          </button>
        </div>
      </section>

      {/* --- Subseção: Componentes Extras (Troféus e Mural) --- */}
      <ColecaoTrofeus trofeusAtivos={trofeusAtivos} aura={aura} />
      <MuralFavoritos mangasUsuario={mangasUsuario} aura={aura} />

    </main>
  );
}