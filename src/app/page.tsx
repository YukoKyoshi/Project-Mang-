"use client";
import AcessoMestre from "./components/AcessoMestre";
import { supabase } from "./supabase";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import MangaCard from "./components/MangaCard";
import AddMangaModal from "./components/AddMangaModal";
import MangaDetailsModal from "./components/MangaDetailsModal";

// ==========================================
// 🎨 CONFIGURAÇÃO DE TEMAS E AURAS
// ==========================================
const TEMAS = {
  verde: { nome: "Verde Néon", bg: "bg-green-500", bgActive: "bg-green-600", text: "text-green-500", border: "border-green-500", focus: "focus:border-green-500 focus:ring-green-500/20", shadow: "shadow-green-500/40" },
  azul: { nome: "Azul Elétrico", bg: "bg-blue-500", bgActive: "bg-blue-600", text: "text-blue-500", border: "border-blue-500", focus: "focus:border-blue-500 focus:ring-blue-500/20", shadow: "shadow-blue-500/40" },
  roxo: { nome: "Roxo Carmesim", bg: "bg-purple-500", bgActive: "bg-purple-600", text: "text-purple-500", border: "border-purple-500", focus: "focus:border-purple-500 focus:ring-purple-500/20", shadow: "shadow-purple-500/40" },
  laranja: { nome: "Laranja Outono", bg: "bg-orange-500", bgActive: "bg-orange-600", text: "text-orange-500", border: "border-orange-500", focus: "focus:border-orange-500 focus:ring-orange-500/20", shadow: "shadow-orange-500/40" },
  custom: { nome: "Cor Livre", bg: "bg-[var(--aura)]", bgActive: "bg-[var(--aura)] brightness-110", text: "text-[var(--aura)]", border: "border-[var(--aura)]", focus: "focus:border-[var(--aura)] focus:ring-[var(--aura)]", shadow: "shadow-[0_0_15px_var(--aura)]" }
};

interface Manga { id: number; titulo: string; capa: string; capitulo_atual: number; total_capitulos: number; status: string; sinopse: string; nota_pessoal: number; nota_amigos: number; comentarios: string; usuario: string; ultima_leitura: string; favorito: boolean; }

export default function Home() {
  // ==========================================
  // 🔐 ESTADOS DE SEGURANÇA E ACESSO
  // ==========================================
  const [mestreAutorizado, setMestreAutorizado] = useState(false);
  const [usuarioAtual, setUsuarioAtual] = useState<string | null>(null);
  const [perfilAlvoParaBloqueio, setPerfilAlvoParaBloqueio] = useState<string | null>(null);
  const [pinDigitado, setPinDigitado] = useState("");

  // ==========================================
  // 📦 ESTADOS DE DADOS E INTERFACE
  // ==========================================
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [perfis, setPerfis] = useState<any[]>([]); 
  const [estaAbertoAdd, setEstaAbertoAdd] = useState(false);
  const [mangaDetalhe, setMangaDetalhe] = useState<Manga | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [mostrarStats, setMostrarStats] = useState(false);
  const [menuDados, setMenuDados] = useState(false);
  const [filtroAtivo, setFiltroAtivo] = useState("Lendo");
  const [pesquisaInterna, setPesquisaInterna] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // 🔄 CICLO DE VIDA (useEffect)
  // ==========================================
  useEffect(() => { 
    // 1. Checa o Portão Principal (SessionStorage mantém mesmo no F5)
    const mestre = sessionStorage.getItem("acesso_mestre");
    if (mestre === "true") setMestreAutorizado(true);

    // 2. [CORREÇÃO F5] Sempre remove o usuário ativo ao recarregar a página
    // Isso garante que o PIN seja solicitado novamente, mas a senha mestra não.
    sessionStorage.removeItem('hunter_ativo');
    setUsuarioAtual(null);
    
    buscarMangas(); 
    buscarPerfis().then(() => setCarregando(false));
  }, []);

  useEffect(() => {
    if (usuarioAtual) buscarMangas();
  }, [usuarioAtual]);

  // ==========================================
  // 🛠️ FUNÇÕES DE BANCO DE DADOS (SUPABASE)
  // ==========================================
  async function buscarMangas() {
    const { data } = await supabase.from("mangas").select("*").order("ultima_leitura", { ascending: false });
    if (data) setMangas(data as Manga[]);
  }

  async function buscarPerfis() {
    const { data } = await supabase.from("perfis").select("*");
    if (data) setPerfis(data);
  }

  async function atualizarCapitulo(manga: Manga, novo: number) {
    if (novo < 0) return;
    let novoStatus = manga.status;
    if (manga.total_capitulos > 0 && novo >= manga.total_capitulos) novoStatus = "Completos";
    else if (novo > 0 && (manga.status === "Planejo Ler" || manga.status === "Dropados")) novoStatus = "Lendo";
    await supabase.from("mangas").update({ capitulo_atual: novo, status: novoStatus, ultima_leitura: new Date().toISOString() }).eq("id", manga.id);
    buscarMangas();
  }

  async function atualizarDados(id: number, campos: any) {
    await supabase.from("mangas").update(campos).eq("id", id);
    setMangas(prev => prev.map(m => m.id === id ? { ...m, ...campos } : m));
    if (mangaDetalhe?.id === id) setMangaDetalhe(prev => prev ? { ...prev, ...campos } : null);
  }

  async function salvarNovaObra(novoManga: any) {
    const existe = mangas.some(m => m.titulo === novoManga.titulo && m.usuario === usuarioAtual);
    if (existe) return alert("⚠️ Você já tem este mangá!");
    let statusFinal = "Planejo Ler";
    if (novoManga.total_capitulos > 0 && novoManga.capitulo_atual >= novoManga.total_capitulos) statusFinal = "Completos";
    else if (novoManga.capitulo_atual > 0) statusFinal = "Lendo";
    await supabase.from("mangas").insert([{ ...novoManga, usuario: usuarioAtual, status: statusFinal, ultima_leitura: new Date().toISOString() }]);
    setEstaAbertoAdd(false);
    buscarMangas();
  }

  // ==========================================
  // 🔑 LÓGICA DE PERFIS E PIN
  // ==========================================
  function tentarMudarPerfil(nomeOriginal: string) {
    if (nomeOriginal === usuarioAtual) return;
    const info = perfis.find(p => p.nome_original === nomeOriginal);
    if (info && info.pin && info.pin.trim() !== "") {
      setPerfilAlvoParaBloqueio(nomeOriginal);
      setPinDigitado("");
    } else {
      setUsuarioAtual(nomeOriginal);
      sessionStorage.setItem('hunter_ativo', nomeOriginal);
    }
  }

  function confirmarAcessoPin() {
    const info = perfis.find(p => p.nome_original === perfilAlvoParaBloqueio);
    if (info && info.pin === pinDigitado) {
      setUsuarioAtual(perfilAlvoParaBloqueio!);
      sessionStorage.setItem('hunter_ativo', perfilAlvoParaBloqueio!);
      setPerfilAlvoParaBloqueio(null);
      setPinDigitado("");
    } else {
      alert("❌ PIN Incorreto! Acesso negado.");
      setPinDigitado("");
    }
  }

  function sairDoPerfil() {
    sessionStorage.removeItem('hunter_ativo');
    setUsuarioAtual(null);
  }

  // ==========================================
  // 🖥️ RENDERING: BLOQUEIO MESTRE
  // ==========================================
  if (!mestreAutorizado) {
    return <AcessoMestre aoAutorizar={() => setMestreAutorizado(true)} />;
  }

  if (carregando) return <div className="min-h-screen bg-[#040405] flex items-center justify-center text-zinc-500 font-bold tracking-widest uppercase">Carregando Sistema...</div>;

  // ==========================================
  // 🖥️ RENDERING: TELA SELEÇÃO DE PERFIL (NETFLIX STYLE)
  // ==========================================
  if (!usuarioAtual) {
    return (
      <main className="min-h-screen bg-[#040405] flex flex-col items-center justify-center p-6 text-[#e5e5e5] relative">
        {perfilAlvoParaBloqueio && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-[#0e0e11] border border-zinc-800 p-10 rounded-[3rem] shadow-2xl flex flex-col items-center max-w-sm w-full relative">
              <button onClick={() => setPerfilAlvoParaBloqueio(null)} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">✕</button>
              <div className="text-6xl mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">🔒</div>
              <h2 className="text-xl font-black text-white uppercase tracking-widest mb-2 text-center">Acesso Restrito</h2>
              <p className="text-xs text-zinc-500 mb-8 text-center">Introduza o PIN de segurança para aceder ao perfil.</p>
              <input autoFocus type="password" maxLength={4} className="bg-zinc-950 border border-zinc-700 focus:border-red-500 rounded-2xl w-full py-4 text-center text-3xl font-black tracking-[1em] text-white outline-none mb-6 shadow-inner transition-colors" value={pinDigitado} onChange={(e) => setPinDigitado(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => e.key === 'Enter' && confirmarAcessoPin()} />
              <button onClick={confirmarAcessoPin} className="w-full bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white font-black uppercase tracking-widest py-4 rounded-xl transition-all border border-red-500/20 hover:border-red-600">Desbloquear</button>
            </div>
          </div>
        )}

        <h1 className="text-4xl md:text-5xl font-black mb-16 tracking-tighter text-white drop-shadow-md">Quem está lendo?</h1>
        <div className="flex flex-wrap justify-center gap-8 md:gap-14">
          {perfis.map(p => {
            const isCustomP = p.cor_tema?.startsWith('#');
            const auraP = isCustomP ? TEMAS.custom : (TEMAS[p.cor_tema as keyof typeof TEMAS] || TEMAS.verde);
            return (
              <div key={p.nome_original} onClick={() => tentarMudarPerfil(p.nome_original)} className="flex flex-col items-center gap-6 cursor-pointer group" style={isCustomP ? { '--aura': p.cor_tema } as React.CSSProperties : {}}>
                <div className={`w-32 h-32 md:w-44 md:h-44 bg-zinc-900 rounded-[3rem] flex items-center justify-center text-7xl shadow-2xl border-4 border-zinc-800 hover:${auraP.border} group-hover:scale-105 transition-all duration-300 relative group-hover:${auraP.shadow}`}>
                  {p.avatar}
                  {p.pin && p.pin !== "" && <div className="absolute -top-3 -right-3 bg-red-600 w-12 h-12 rounded-full flex items-center justify-center text-xl border-4 border-[#040405] shadow-lg">🔒</div>}
                </div>
                <span className="text-zinc-500 font-black tracking-widest uppercase text-sm group-hover:text-white transition-colors">{p.nome_exibicao}</span>
              </div>
            );
          })}
        </div>
      </main>
    );
  }

  // ==========================================
  // 🖥️ RENDERING: ESTANTE DE MANGÁS (LOGADO)
  // ==========================================
  const perfilAtivo = perfis.find(p => p.nome_original === usuarioAtual) || { nome_exibicao: usuarioAtual, avatar: "👤", cor_tema: "verde" };
  const isCustom = perfilAtivo.cor_tema?.startsWith('#');
  const aura = isCustom ? TEMAS.custom : (TEMAS[perfilAtivo.cor_tema as keyof typeof TEMAS] || TEMAS.verde);
  
  const mangasFiltrados = mangas.filter(m => m.usuario === usuarioAtual).filter(m => (filtroAtivo === "Todos" ? true : m.status === filtroAtivo)).filter(m => m.titulo.toLowerCase().includes(pesquisaInterna.toLowerCase()));

  return (
    <main 
      className={`min-h-screen bg-[#0a0a0c] p-6 md:p-10 text-[#e5e5e5] selection:${aura.bg}/30`}
      style={isCustom ? { '--aura': perfilAtivo.cor_tema } as React.CSSProperties : {}}
    >
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-50">
        <section>
          <h1 className="text-3xl font-bold tracking-tight">Estante de Mangás</h1>
          <div className="flex gap-3 mt-4">
            {perfis.map(p => (
              <button key={p.nome_original} onClick={() => tentarMudarPerfil(p.nome_original)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold border transition-all ${usuarioAtual === p.nome_original ? `${aura.bgActive} border-transparent text-white shadow-lg scale-105` : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"}`}>
                <span className="text-sm">{p.avatar}</span>
                <span className="uppercase tracking-widest">{p.nome_exibicao}</span>
                {p.pin && p.pin !== "" && usuarioAtual !== p.nome_original && <span className="text-red-500 ml-1">🔒</span>}
              </button>
            ))}
          </div>
        </section>

        <section className="flex gap-2 w-full md:w-auto items-center flex-wrap md:flex-nowrap">
          <Link href="/perfil" className={`group flex items-center gap-3 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:${aura.border} transition-all`}>
            <div className={`w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-xl shadow-lg border border-zinc-800 group-hover:${aura.border} transition-colors`}>{perfilAtivo.avatar}</div>
            <div className="flex flex-col"><span className="text-[10px] font-bold text-zinc-500 uppercase leading-none">Acessar Perfil</span><span className="text-xs font-black text-white line-clamp-1">{perfilAtivo.nome_exibicao}</span></div>
          </Link>
          <button onClick={sairDoPerfil} className="px-4 py-3 bg-red-950/30 text-red-500 border border-red-900/50 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-lg">Sair 🚪</button>
          
          <button onClick={() => setMostrarStats(!mostrarStats)} className={`px-4 py-3 rounded-xl font-bold border transition-all ${mostrarStats ? `${aura.bg} border-transparent text-white` : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>📊</button>
          
          <button onClick={() => setEstaAbertoAdd(true)} className={`px-6 py-3 bg-[#e5e5e5] text-black rounded-xl font-bold hover:${aura.bgActive} hover:text-white transition-all shadow-xl whitespace-nowrap`}>
            + Adicionar Obra
          </button>
        </section>
      </header>

      <div className={`transition-all duration-500 ${estaAbertoAdd || mangaDetalhe || perfilAlvoParaBloqueio ? "blur-md opacity-20 pointer-events-none" : ""}`}>
        <div className="mb-6">
          <input type="text" placeholder="🔍 Buscar na minha estante..." className={`w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-sm outline-none transition-colors ${aura.focus}`} value={pesquisaInterna} onChange={(e) => setPesquisaInterna(e.target.value)} />
        </div>
        
        <nav className="flex gap-6 mb-10 border-b border-zinc-900 overflow-x-auto no-scrollbar">
          {["Lendo", "Planejo Ler", "Completos", "Dropados", "Todos"].map(s => (
            <button key={s} onClick={() => setFiltroAtivo(s)} className={`text-xs font-bold relative pb-4 transition-all ${filtroAtivo === s ? aura.text : "text-zinc-500 hover:text-zinc-300"}`}>
              {s}
              {filtroAtivo === s && <div className={`absolute bottom-0 w-full h-1 ${aura.bg} shadow-[0_0_10px_var(--aura)]`} />}
            </button>
          ))}
        </nav>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {mangasFiltrados.map(m => (
            <MangaCard 
              key={m.id} 
              manga={m} 
              atualizarCapitulo={atualizarCapitulo} 
              deletarManga={(id) => { if(confirm("Excluir?")) supabase.from("mangas").delete().eq("id", id).then(buscarMangas) }} 
              mudarStatusManual={(id, s) => atualizarDados(id, {status: s})} 
              abrirDetalhes={(m) => setMangaDetalhe(m as Manga)} 
              aura={aura} 
            />
          ))}
        </div>
      </div>
      
      <AddMangaModal estaAberto={estaAbertoAdd} fechar={() => setEstaAbertoAdd(false)} usuarioAtual={usuarioAtual} aoSalvar={salvarNovaObra} />
      <MangaDetailsModal manga={mangaDetalhe} aoFechar={() => setMangaDetalhe(null)} aoAtualizarCapitulo={atualizarCapitulo} aoAtualizarDados={atualizarDados} aoDeletar={(id) => { if(confirm("Excluir?")) supabase.from("mangas").delete().eq("id", id).then(() => { setMangaDetalhe(null); buscarMangas(); }) }} />
    </main>
  );
}