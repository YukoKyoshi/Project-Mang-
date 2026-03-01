"use client";

// ==========================================
// [SESSÃO 1] - IMPORTAÇÕES E TEMAS
// ==========================================
import { supabase } from "../supabase";
import { useEffect, useState } from "react";
import Link from "next/link";

const TEMAS = {
  verde: { text: "text-green-500", border: "border-green-500", glow: "shadow-green-500/20" },
  azul: { text: "text-blue-500", border: "border-blue-500", glow: "shadow-blue-500/20" },
  roxo: { text: "text-purple-500", border: "border-purple-500", glow: "shadow-purple-500/20" },
  laranja: { text: "text-orange-500", border: "border-orange-500", glow: "shadow-orange-500/20" },
  custom: { text: "text-[var(--aura)]", border: "border-[var(--aura)]", glow: "shadow-[var(--aura)]/20" }
};

export default function PerfilPage() {
  // ==========================================
  // [SESSÃO 2] - ESTADOS
  // ==========================================
  const [usuarioAtivo, setUsuarioAtivo] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState("STATUS");
  const [telaCheia, setTelaCheia] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // ✅ Como deve estar na Sessão 2
  const [dadosPerfil, setDadosPerfil] = useState({ 
    nome: "", 
    avatar: "", 
    bio: "", 
    tema: "azul", 
    custom_color: "#3b82f6",
    pin: "" // 🔑 Garante que o PIN comece vazio, mas exista no contrato
  });
  
  const [obrasUsuario, setObrasUsuario] = useState<any[]>([]);
  const [stats, setStats] = useState({ 
    obras: 0, caps: 0, finais: 0, horasVida: 0, favs: 0 
  });

  const [elo, setElo] = useState({ tier: "BRONZE", cor: "from-orange-800 to-orange-500", glow: "shadow-orange-900/20", efeito: "" });

  // ==========================================
  // [SESSÃO 3] - CORE LOGIC (SEGURANÇA E DADOS)
  // ==========================================
  useEffect(() => {
    const hunter = sessionStorage.getItem("hunter_ativo");
    if (!hunter) { window.location.href = '/'; return; }
    setUsuarioAtivo(hunter);
  }, []);

  useEffect(() => { if (usuarioAtivo) carregarDados(); }, [usuarioAtivo]);

  async function carregarDados() {
    const { data: mangas } = await supabase.from("mangas").select("*").eq("usuario", usuarioAtivo);
    const { data: animes } = await supabase.from("animes").select("*").eq("usuario", usuarioAtivo);
    const { data: perfil } = await supabase.from("perfis").select("*").eq("nome_original", usuarioAtivo).single();

    if (mangas || animes) {
      const all = [...(mangas || []), ...(animes || [])];
      const epsVistos = (animes || []).reduce((acc, a) => acc + (a.capitulo_atual || 0), 0);
      
      setObrasUsuario(all);
      setStats({
        obras: all.length,
        caps: all.reduce((acc, o) => acc + (o.capitulo_atual || 0), 0),
        finais: all.filter(o => o.status === "Completos").length,
        horasVida: Math.floor((epsVistos * 23) / 60),
        favs: all.filter(o => o.favorito === true || o.favorito === "true").length
      });

      const t = all.length;
      if (t >= 1000) setElo({ tier: "DIVINDADE", cor: "from-white via-cyan-200 to-white", glow: "shadow-white/50", efeito: "animate-pulse" });
      else if (t >= 750) setElo({ tier: "LENDA VIVA", cor: "from-yellow-200 via-yellow-500 to-yellow-700", glow: "shadow-yellow-500/80", efeito: "animate-bounce-slow" });
      else if (t >= 500) setElo({ tier: "DESAFIANTE", cor: "from-red-600 via-purple-600 to-blue-600", glow: "shadow-purple-500/60", efeito: "" });
      else if (t >= 350) setElo({ tier: "GRÃO-MESTRE", cor: "from-red-500 to-red-900", glow: "shadow-red-500/50", efeito: "" });
      else if (t >= 200) setElo({ tier: "MESTRE", cor: "from-purple-400 to-purple-900", glow: "shadow-purple-500/40", efeito: "" });
      else if (t >= 120) setElo({ tier: "DIAMANTE", cor: "from-blue-400 to-indigo-600", glow: "shadow-blue-500/50", efeito: "" });
      else if (t >= 70) setElo({ tier: "PLATINA", cor: "from-emerald-400 to-cyan-500", glow: "shadow-emerald-500/40", efeito: "" });
      else if (t >= 40) setElo({ tier: "OURO", cor: "from-yellow-400 to-amber-600", glow: "shadow-yellow-500/30", efeito: "" });
      else if (t >= 20) setElo({ tier: "PRATA", cor: "from-zinc-400 to-zinc-100", glow: "shadow-zinc-400/20", efeito: "" });
      else setElo({ tier: "BRONZE", cor: "from-orange-800 to-orange-500", glow: "shadow-orange-900/10", efeito: "" });
    }

    if (perfil) {
      setDadosPerfil({
        nome: perfil.nome_exibicao || usuarioAtivo!,
        avatar: perfil.avatar || "https://i.imgur.com/8Km9t4S.png",
        bio: perfil.bio || "",
        tema: perfil.cor_tema || "azul",
        custom_color: perfil.custom_color || "#3b82f6",
        pin: perfil.pin || "" // ✅ ADICIONE ESTA LINHA para resolver o erro 2345
      });
    }
    setCarregando(false);
  }

  // ✅ CORREÇÃO 2: SALVAMENTO PERSISTENTE
  async function atualizarPerfil() {
    setSalvando(true);
    try {
      // 💾 Salvando no Supabase (Isso garante que apareça na escolha de perfil e estantes)
      const { error } = await supabase.from("perfis").update({
        nome_exibicao: dadosPerfil.nome,
        avatar: dadosPerfil.avatar,
        cor_tema: dadosPerfil.tema,
        custom_color: dadosPerfil.custom_color,
        pin: dadosPerfil.pin // ✅ PIN agora é persistente
      }).eq("nome_original", usuarioAtivo);
      
      if (error) throw error;

      alert("✨ Hunter Sincronizado! As mudanças agora são globais.");
      
      // Força o recarregamento para que o tema e nome atualizem no cabeçalho e estantes
      window.location.reload(); 
    } catch (err: any) {
      alert("❌ Erro ao sincronizar: " + err.message);
    } finally {
      setSalvando(false);
    }
  }
  // ✅ CORREÇÃO 5: BACKUP (EXPORT/IMPORT)
  async function exportarBiblioteca() {
    try {
      const { data: m } = await supabase.from("mangas").select("*").eq("usuario", usuarioAtivo);
      const { data: a } = await supabase.from("animes").select("*").eq("usuario", usuarioAtivo);
      const backup = { hunter: dadosPerfil.nome, biblioteca: { mangas: m || [], animes: a || [] } };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = `backup_${usuarioAtivo}.json`;
      link.click();
    } catch { alert("Erro ao exportar."); }
  }

  async function importarBiblioteca(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = JSON.parse(event.target?.result as string);
      const format = (o: any) => { const { id, ...r } = o; return { ...r, usuario: usuarioAtivo }; };
      await supabase.from("mangas").insert(content.biblioteca.mangas.map(format));
      await supabase.from("animes").insert(content.biblioteca.animes.map(format));
      alert("Importação Concluída!"); carregarDados();
    };
    reader.readAsText(file);
  }

  // ==========================================
  // [SESSÃO 4] - 50 TROFÉUS (CORREÇÃO VISUAL)
  // ==========================================
  const aura = dadosPerfil.tema === "custom" ? TEMAS.custom : (TEMAS[dadosPerfil.tema as keyof typeof TEMAS] || TEMAS.azul);

  const listaTrofeus = Array.from({ length: 50 }, (_, i) => {
    const id = i + 1;
    let check = false;
    let icone = "🔒";
    let nome = `Troféu ${id}`;
    let desc = `Bloqueado: Requer mais progresso Hunter.`;

    if (id === 1) { nome = "Semente"; desc = "1 Obra"; icone = "🌱"; check = stats.obras >= 1; }
    if (id === 2) { nome = "Viciado"; desc = "10 Obras"; icone = "🔥"; check = stats.obras >= 10; }
    if (id === 3) { nome = "Maratona"; desc = "100 Caps"; icone = "🏃"; check = stats.caps >= 100; }
    if (id === 4) { nome = "Vida Gasta"; desc = "10 Horas"; icone = "⏳"; check = stats.horasVida >= 10; }
    if (id === 5) { nome = "Curador"; desc = "5 Favoritos"; icone = "💎"; check = stats.favs >= 5; }
    // Gerador lógico para os demais
    if (id > 5) { check = stats.obras >= (id * 5); icone = check ? "🎖️" : "🔒"; }
    
    return { id, nome, desc, icone, check };
  });

  // ✅ CORREÇÃO 4: RECOMPENSAS SEM CONFLITO
  const listaMissoes = [
    { id: 1, titulo: "O Colecionador", obj: "Ter 100 obras", prog: stats.obras, meta: 100, rec: "Emblema Exclusivo" },
    { id: 2, titulo: "Vida Eterna", obj: "1.000 Horas", prog: stats.horasVida, meta: 1000, rec: "Avatar Especial" },
    { id: 3, titulo: "Alpha Hunter", obj: "Completar 50 Séries", prog: stats.finais, meta: 50, rec: "Fundo Animado" }
  ];

  if (carregando) return <div className="min-h-screen bg-[#040405] flex items-center justify-center text-white font-black italic">CARREGANDO HUB...</div>;

  return (
    <main className="min-h-screen bg-[#040405] flex flex-col items-center justify-center p-6 transition-all duration-500 relative overflow-hidden" style={{ "--aura": dadosPerfil.custom_color } as any}>
      
      {/* ✅ CORREÇÃO 1: BOTÕES SUPERIORES RESTAURADOS */}
      <div className="fixed top-0 left-0 w-full p-6 md:p-10 flex justify-between items-center z-[110] pointer-events-none">
        <Link href="/" className="pointer-events-auto text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors bg-black/50 px-4 py-2 rounded-xl backdrop-blur-md border border-white/5">
          ← Voltar à Estante
        </Link>
        <button 
          onClick={() => setTelaCheia(!telaCheia)}
          className="pointer-events-auto text-[10px] font-black uppercase tracking-widest bg-zinc-900/90 backdrop-blur-md px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white transition-all shadow-xl"
        >
          {telaCheia ? "⊙ Vista Central" : "⛶ Tela Cheia"}
        </button>
      </div>

      <div className={`bg-[#0e0e11]/90 backdrop-blur-xl rounded-[3.5rem] p-12 mt-12 md:mt-0 border border-white/5 relative flex flex-col items-center shadow-2xl transition-all duration-700 ${elo.glow} ring-1 ring-white/10 ${elo.efeito} ${telaCheia ? 'w-full max-w-6xl' : 'w-full max-w-[550px]'}`}>
        
        {/* Identidade */}
        <div className={`w-28 h-28 bg-zinc-950 rounded-[2.5rem] overflow-hidden border-2 transition-all duration-500 ${aura.border} ${elo.glow}`}>
          <img src={dadosPerfil.avatar} className="w-full h-full object-cover" alt="" />
        </div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter mt-6 mb-1 italic">{dadosPerfil.nome}</h1>
        <p className={`text-[10px] font-black bg-gradient-to-r ${elo.cor} bg-clip-text text-transparent uppercase tracking-[0.5em] mb-10`}>RANK: {elo.tier}</p>

        {/* Navegação */}
        <div className="flex flex-wrap gap-6 md:gap-8 border-b border-white/5 w-full justify-center pb-6 mb-10 relative z-20">
          {["STATUS", "TROFÉUS", "MISSÕES", "CONFIG"].map(aba => (
            <button key={aba} onClick={() => setAbaAtiva(aba)} className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all ${abaAtiva === aba ? aura.text + " scale-110" : 'text-zinc-600 hover:text-zinc-400'}`}>
              {aba}
            </button>
          ))}
        </div>

        {/* Área de Conteúdo */}
        <div className="w-full h-[320px] overflow-y-auto custom-scrollbar px-2">
          
          {abaAtiva === "STATUS" && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95">
              <div className="bg-black/40 border border-white/5 p-6 rounded-3xl flex flex-col items-center">
                <span className="text-3xl font-black text-white italic">{stats.obras}</span>
                <span className="text-[7px] font-black text-zinc-600 uppercase mt-2">Obras</span>
              </div>
              <div className="bg-black/40 border border-white/5 p-6 rounded-3xl flex flex-col items-center">
                <span className="text-3xl font-black text-white italic">{stats.caps}</span>
                <span className="text-[7px] font-black text-zinc-600 uppercase mt-2">Progresso</span>
              </div>
              <div className="col-span-2 bg-gradient-to-r from-zinc-900 to-black p-6 rounded-3xl border border-white/5 flex items-center justify-between group">
                 <div>
                   <span className="text-2xl font-black text-white italic tracking-tighter">{stats.horasVida} HORAS</span>
                   <p className="text-[7px] font-black text-zinc-500 uppercase mt-1 tracking-widest italic">Vida gasta assistindo kkkk</p>
                 </div>
                 <span className="text-4xl opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all">⏳</span>
              </div>
            </div>
          )}

          {/* ✅ CORREÇÃO 3: TROFÉUS OFUSCADOS */}
          {abaAtiva === "TROFÉUS" && (
            <div className="grid grid-cols-5 gap-y-10 gap-x-2 justify-items-center animate-in fade-in slide-in-from-right-4">
              {listaTrofeus.map(t => (
                <div key={t.id} className="flex flex-col items-center group relative">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border-2 transition-all duration-700 
                    ${t.check ? aura.border + " " + aura.glow + " bg-black/40" : "border-zinc-800 opacity-10 grayscale blur-[1px]"}`}>
                    {t.icone}
                  </div>
                  <div className="absolute -top-12 bg-black border border-white/10 px-3 py-2 rounded-xl text-[8px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-2xl">
                    <p className={`${t.check ? 'text-green-500' : 'text-zinc-600'} uppercase mb-1 font-black`}>{t.nome}</p>
                    {t.desc}
                  </div>
                </div>
              ))}
            </div>
          )}

          {abaAtiva === "MISSÕES" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
              {listaMissoes.map(m => (
                <div key={m.id} className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5 relative group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-xs font-black text-white uppercase italic">{m.titulo}</h4>
                      <p className="text-[8px] text-zinc-500 uppercase mt-1">{m.obj}</p>
                    </div>
                    <span className="text-[9px] font-black text-blue-500">🎁 {m.rec}</span>
                  </div>
                  <div className="w-full h-1 bg-black rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all" style={{ width: `${Math.min((m.prog/m.meta)*100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {abaAtiva === "CONFIG" && (
            <div className="space-y-6 animate-in fade-in zoom-in-95">
              {/* Nome e Avatar */}
              <div className="grid grid-cols-1 gap-4">
                <input type="text" placeholder="Nome de Caçador" className="w-full bg-black border border-white/5 p-4 rounded-xl text-white font-bold outline-none focus:border-white/20" value={dadosPerfil.nome} onChange={e => setDadosPerfil({...dadosPerfil, nome: e.target.value})} />
                <input type="text" placeholder="URL do Avatar" className="w-full bg-black border border-white/5 p-4 rounded-xl text-white text-xs outline-none focus:border-white/20" value={dadosPerfil.avatar} onChange={e => setDadosPerfil({...dadosPerfil, avatar: e.target.value})} />
              </div>

              {/* ✅ NOVO: Alteração de PIN */}
              <div>
                <label className="text-[8px] font-black text-zinc-500 uppercase mb-2 block tracking-widest">Código PIN de Acesso</label>
                <input 
                  type="password" 
                  maxLength={4}
                  placeholder="Ex: 1234" 
                  className="w-full bg-black border border-white/5 p-4 rounded-xl text-white font-bold tracking-[1em] text-center outline-none focus:border-white/20" 
                  value={dadosPerfil.pin} 
                  onChange={e => setDadosPerfil({...dadosPerfil, pin: e.target.value})} 
                />
              </div>

              {/* Temas e Cores */}
              <div className="grid grid-cols-2 gap-4">
                <select className="w-full bg-black border border-white/5 p-4 rounded-xl text-white text-[10px] font-bold uppercase" value={dadosPerfil.tema} onChange={e => setDadosPerfil({...dadosPerfil, tema: e.target.value})}>
                  <option value="azul">Azul Neon</option>
                  <option value="verde">Verde Hacker</option>
                  <option value="roxo">Roxo Galático</option>
                  <option value="laranja">Laranja Fogo</option>
                  <option value="custom">Personalizada</option>
                </select>
                {dadosPerfil.tema === "custom" && <input type="color" className="w-full h-12 bg-black border border-white/5 rounded-xl cursor-pointer" value={dadosPerfil.custom_color} onChange={e => setDadosPerfil({...dadosPerfil, custom_color: e.target.value})} />}
              </div>

              <button onClick={atualizarPerfil} disabled={salvando} className="w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest bg-white text-black hover:scale-[1.02] transition-all shadow-xl">
                {salvando ? "Sincronizando..." : "Sincronizar Hunter"}
              </button>
            </div>
          )}
        </div>

        {/* ✅ CORREÇÃO 5: BOTÕES DE BACKUP RESTAURADOS */}
        <div className="w-full flex flex-col gap-3 mt-8">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={exportarBiblioteca} className="py-4 rounded-xl border border-zinc-800 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all flex items-center justify-center gap-2">💾 Exportar</button>
            <label className="py-4 rounded-xl border border-zinc-800 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer">
              📥 Importar <input type="file" accept=".json" onChange={importarBiblioteca} className="hidden" />
            </label>
          </div>
          <button onClick={() => { sessionStorage.removeItem('hunter_ativo'); window.location.href = '/'; }} className="w-full py-3 text-[8px] font-black text-zinc-700 hover:text-red-500 uppercase tracking-[0.3em] transition-all">Encerrar Sessão</button>
        </div>

      </div>
    </main>
  );
}