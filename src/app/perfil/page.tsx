"use client";

// ==========================================
// [SESSÃO 1] - IMPORTAÇÕES E TEMAS
// ==========================================
import { supabase } from "../supabase";
import { useEffect, useState } from "react";
import Link from "next/link";

const TEMAS = {
  verde: { bg: "bg-green-500", text: "text-green-500", border: "border-green-500", button: "bg-green-500 hover:bg-green-600", focus: "focus:border-green-500", shadow: "shadow-[0_0_20px_rgba(34,197,94,0.4)]" },
  azul: { bg: "bg-blue-500", text: "text-blue-500", border: "border-blue-500", button: "bg-blue-500 hover:bg-blue-600", focus: "focus:border-blue-500", shadow: "shadow-[0_0_20px_rgba(59,130,246,0.4)]" },
  roxo: { bg: "bg-purple-500", text: "text-purple-500", border: "border-purple-500", button: "bg-purple-500 hover:bg-purple-600", focus: "focus:border-purple-500", shadow: "shadow-[0_0_20px_rgba(168,85,247,0.4)]" },
  laranja: { bg: "bg-orange-500", text: "text-orange-500", border: "border-orange-500", button: "bg-orange-500 hover:bg-orange-600", focus: "focus:border-orange-500", shadow: "shadow-[0_0_20px_rgba(249,115,22,0.4)]" },
  custom: { bg: "bg-[var(--aura)]", text: "text-[var(--aura)]", border: "border-[var(--aura)]", button: "bg-[var(--aura)] brightness-110", focus: "focus:border-[var(--aura)]", shadow: "shadow-[0_0_15px_var(--aura)]" }
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
    const { data: animes } = await supabase.from("animes").select("*").eq("usuario", usuarioAtivo);
    const { data: perfil } = await supabase.from("perfis").select("*").eq("nome_original", usuarioAtivo).single();

    if (mangas || animes) {
      const totalObras = (mangas?.length || 0) + (animes?.length || 0);
      const totalCaps = [...(mangas || []), ...(animes || [])].reduce((acc, o) => acc + (o.capitulo_atual || 0), 0);
      const totalFinais = [...(mangas || []), ...(animes || [])].filter(o => o.status === "Completos").length;

      setMangasUsuario([...(mangas || []), ...(animes || [])]);
      setStats({ obras: totalObras, caps: totalCaps, finais: totalFinais });
      
      if (totalObras >= 100) setElo({ tier: "DIAMANTE", cor: "from-blue-400 to-indigo-600", glow: "shadow-blue-500/50 ring-blue-500/30" });
      else if (totalObras >= 70) setElo({ tier: "PLATINA", cor: "from-emerald-400 to-cyan-500", glow: "shadow-emerald-500/40 ring-emerald-500/20" });
      else if (totalObras >= 40) setElo({ tier: "OURO", cor: "from-yellow-400 to-amber-600", glow: "shadow-yellow-500/30 ring-yellow-500/20" });
      else if (totalObras >= 20) setElo({ tier: "PRATA", cor: "from-zinc-400 to-zinc-100", glow: "shadow-zinc-400/20 ring-zinc-400/10" });
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

  // ### Subtítulo: Função: Exportar Backup da Biblioteca
  async function exportarBiblioteca() {
    try {
      if (!usuarioAtivo) return;
      const { data: mangas } = await supabase.from("mangas").select("*").eq("usuario", usuarioAtivo);
      const { data: animes } = await supabase.from("animes").select("*").eq("usuario", usuarioAtivo);

      const backup = {
        hunter: dadosPerfil.nome,
        data_exportacao: new Date().toISOString(),
        stats: stats,
        biblioteca: { mangas: mangas || [], animes: animes || [] }
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_hunter_${usuarioAtivo}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) { alert("Falha ao gerar backup."); }
  }
    // --- [SESSÃO: IMPORTAR BACKUP] ---
  async function importarBiblioteca(event: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    if (!arquivo || !usuarioAtivo) return;

    const confirmar = confirm("⚠️ Isso irá adicionar as obras do backup à sua estante atual. Deseja prosseguir?");
    if (!confirmar) return;

    const leitor = new FileReader();
    leitor.onload = async (e) => {
      try {
        const conteudo = JSON.parse(e.target?.result as string);
        const { mangas, animes } = conteudo.biblioteca;

        // Preparamos os dados garantindo que o ID seja novo e o usuário seja o atual
        const formatarObra = (obra: any) => {
          const { id, ...resto } = obra; // Removemos o ID antigo para não dar conflito
          return { ...resto, usuario: usuarioAtivo };
        };

        if (mangas?.length > 0) {
          await supabase.from("mangas").insert(mangas.map(formatarObra));
        }
        
        if (animes?.length > 0) {
          await supabase.from("animes").insert(animes.map(formatarObra));
        }

        alert("✨ Sincronização concluída! Sua estante foi restaurada.");
        carregarDados(); // Recarrega os números na tela
      } catch (err) {
        alert("❌ Erro ao ler o arquivo de backup. Verifique se o formato está correto.");
      }
    };
    leitor.readAsText(arquivo);
  }

  // ==========================================
  // [SESSÃO 4] - LÓGICA DE TROFÉUS
  // ==========================================
  const isCustom = dadosPerfil.tema?.startsWith('#');
  const aura = isCustom ? TEMAS.custom : (TEMAS[dadosPerfil.tema as keyof typeof TEMAS] || TEMAS.azul);
  
  const trofeusProps = {
    total: stats.obras,
    concluidos: stats.finais,
    caps: stats.caps,
    favoritos: mangasUsuario.filter(m => m.favorito === true || m.favorito === "true").length
  };

  const listaTrofeus = [
    { id: 1, nome: "Primeiro Passo", desc: "Adicionou a primeira obra", icone: "🌱", check: trofeusProps.total >= 1 },
    { id: 2, nome: "Maratonista", desc: "Leu mais de 500 capítulos", icone: "🏃", check: trofeusProps.caps >= 500 },
    { id: 3, nome: "Finalizador", desc: "Completou 10 séries", icone: "🏆", check: trofeusProps.concluidos >= 10 },
    { id: 4, nome: "Curador", desc: "Marcar 5 favoritos", icone: "💎", check: trofeusProps.favoritos >= 5 },
    { id: 5, nome: "Colecionador", desc: "Ter 50 obras", icone: "📚", check: trofeusProps.total >= 50 },
    { id: 6, nome: "Viciado", desc: "Ler 2000 capítulos", icone: "⚡", check: trofeusProps.caps >= 2000 },
    { id: 7, nome: "Mestre", desc: "Completou 50 séries", icone: "👑", check: trofeusProps.concluidos >= 50 },
    { id: 8, nome: "Lendário", desc: "Ter 100 favoritos", icone: "🌟", check: trofeusProps.favoritos >= 100 },
    { id: 9, nome: "Ascensão", desc: "10.000 capítulos", icone: "🌌", check: trofeusProps.caps >= 10000 },
    { id: 10, nome: "Caçador Nato", desc: "Criou o Perfil", icone: "🔥", check: true },
  ];

  if (carregando) return <div className="min-h-screen bg-[#040405] flex items-center justify-center text-white font-black italic">CARREGANDO...</div>;

  return (
    <main className="min-h-screen bg-[#040405] flex flex-col items-center justify-center p-6 transition-all duration-500 overflow-hidden relative">
      
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

      <div className={`bg-[#0e0e11] rounded-[3rem] p-10 mt-12 md:mt-0 border border-white/5 transition-all duration-700 relative flex flex-col items-center shadow-2xl ${elo.glow} ring-2 ${telaCheia ? 'w-full max-w-6xl' : 'w-full max-w-[520px]'}`}>
        
        <div className={`w-24 h-24 bg-zinc-950 rounded-[1.5rem] flex items-center justify-center text-5xl border-2 ${aura.border} shadow-lg mb-4`}>
          {dadosPerfil.avatar}
        </div>
        <h1 className="text-3xl font-black text-white uppercase tracking-wider mb-1">{dadosPerfil.nome}</h1>
        <p className={`text-[12px] font-black bg-gradient-to-r ${elo.cor} bg-clip-text text-transparent uppercase tracking-[0.3em] mb-8`}>RANK: {elo.tier}</p>

        <div className="flex gap-12 border-b border-zinc-800/50 w-full justify-center pb-4 mb-8 relative z-20">
          <button onClick={() => setAbaAtiva("STATUS")} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all ${abaAtiva === "STATUS" ? aura.text : 'text-zinc-600 hover:text-white'}`}>HUNTER STATUS</button>
          <button onClick={() => setAbaAtiva("TROFÉUS")} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all ${abaAtiva === "TROFÉUS" ? aura.text : 'text-zinc-600 hover:text-white'}`}>TROFÉUS</button>
        </div>

        <div className="w-full h-[210px] relative overflow-hidden">
          <div className={`absolute inset-0 w-full flex flex-col justify-between transition-all duration-500 ease-out ${abaAtiva === "STATUS" ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10 pointer-events-none"}`}>
             <div className="grid grid-cols-3 gap-4">
                {[{ label: "OBRAS", val: stats.obras }, { label: "CAPS", val: stats.caps }, { label: "FINAIS", val: stats.finais }].map(s => (
                  <div key={s.label} className="bg-black/40 border border-white/5 rounded-2xl py-6 flex flex-col items-center">
                    <span className="text-2xl font-black text-white italic">{s.val}</span>
                    <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mt-2">{s.label}</span>
                  </div>
                ))}
             </div>
             <div className="w-full">
                {dadosPerfil.anilist_token ? (
                  <div className="bg-green-500/5 border border-green-500/20 rounded-xl py-4 flex justify-center items-center gap-2 text-green-500 text-[9px] font-black uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Sincronizado
                  </div>
                ) : (
                  <button onClick={() => window.location.href = `/api/auth/anilist?hunter=${usuarioAtivo}`} className="w-full bg-[#02a9ff] hover:bg-[#008dff] text-white rounded-xl py-4 text-[10px] font-black uppercase tracking-widest flex justify-center items-center gap-2 transition-transform active:scale-95">
                    <img src="https://anilist.co/img/icons/icon.svg" className="w-3 h-3 invert" alt="" /> Conectar AniList
                  </button>
                )}
             </div>
          </div>

          <div className={`absolute inset-0 w-full transition-all duration-500 ease-out overflow-y-auto custom-scrollbar pr-2 ${abaAtiva === "TROFÉUS" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10 pointer-events-none"}`}>
            <div className="grid grid-cols-5 gap-y-6 gap-x-2 justify-items-center">
              {listaTrofeus.map(t => (
                <div key={t.id} className="flex flex-col items-center group relative cursor-help">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-2xl border-2 transition-all duration-500 ${t.check ? aura.border + ' ' + aura.shadow + ' bg-black/40' : 'border-zinc-800/50 bg-black/20 opacity-40 grayscale'}`}>
                    {t.icone}
                  </div>
                  <span className="text-[6px] md:text-[7px] font-black text-zinc-500 uppercase mt-2 text-center leading-tight w-full truncate px-1">{t.nome}</span>
                  <div className="absolute -top-10 bg-zinc-950 border border-zinc-800 text-white text-[8px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-xl">{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ✅ BOTÕES DE GERENCIAMENTO (SISTEMA DE BACKUP COMPLETO) */}
        <div className="w-full flex flex-col gap-3 mt-8">
          <div className="grid grid-cols-2 gap-3">
            {/* Exportar */}
            <button 
              onClick={exportarBiblioteca}
              className="py-4 rounded-xl border border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-500 transition-all flex items-center justify-center gap-2 group hover:border-white/20 hover:text-white"
            >
              <span className="text-sm group-hover:scale-125 transition-transform">💾</span>
              Exportar
            </button>

            {/* Importar (Botão com Input Escondido) */}
            <label className="py-4 rounded-xl border border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-500 transition-all flex items-center justify-center gap-2 group hover:border-white/20 hover:text-white cursor-pointer">
              <span className="text-sm group-hover:scale-125 transition-transform">📥</span>
              Importar
              <input type="file" accept=".json" onChange={importarBiblioteca} className="hidden" />
            </label>
          </div>

          {/* Sair do Perfil */}
          <button 
            onClick={() => { sessionStorage.removeItem('hunter_ativo'); window.location.href = '/'; }}
            className="w-full py-4 rounded-xl border border-red-500/20 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-all"
          >
            SAIR DO PERFIL
          </button>
        </div>

      </div>
    </main>
  );
}