"use client";

// ==========================================
// 📦 1. IMPORTAÇÕES E DEPENDÊNCIAS
// ==========================================
import AcessoMestre from "./components/AcessoMestre";
import { supabase } from "./supabase";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import MangaCard from "./components/MangaCard";
import AddMangaModal from "./components/AddMangaModal";
import MangaDetailsModal from "./components/MangaDetailsModal";

// ==========================================
// 🎨 2. DICIONÁRIO DE AURAS (TEMAS)
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
  // 🔐 3. ESTADOS DE SEGURANÇA E ACESSO
  // ==========================================
  const [mestreAutorizado, setMestreAutorizado] = useState(false);
  const [usuarioAtual, setUsuarioAtual] = useState<string | null>(null);
  const [perfilAlvoParaBloqueio, setPerfilAlvoParaBloqueio] = useState<string | null>(null);
  const [pinDigitado, setPinDigitado] = useState("");

  // ==========================================
  // 📦 4. ESTADOS DE DADOS E INTERFACE
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
  // 🔄 5. LÓGICA DE INICIALIZAÇÃO
  // ==========================================
  useEffect(() => { 
    const mestre = sessionStorage.getItem("acesso_mestre");
    if (mestre === "true") setMestreAutorizado(true);

    // Reset de usuário no F5 para segurança do PIN
    sessionStorage.removeItem('hunter_ativo');
    setUsuarioAtual(null);
    
    buscarPerfis().then(() => setCarregando(false));
  }, []);

  // Sempre que o usuário mudar, resetamos a lista e buscamos de novo
  useEffect(() => {
    if (usuarioAtual) {
        setMangas([]); // Limpa a tela para evitar "flash" do usuário anterior
        buscarMangas();
    }
  }, [usuarioAtual]);

  // ==========================================
  // 🛠️ 6. FUNÇÕES DO BANCO DE DADOS (SUPABASE)
  // ==========================================
  async function buscarMangas() {
    if (!usuarioAtual) return;
    const { data } = await supabase.from("mangas")
      .select("*")
      .eq("usuario", usuarioAtual)
      .order("ultima_leitura", { ascending: false });
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
    const existe = mangas.some(m => m.titulo === novoManga.titulo);
    if (existe) return alert("⚠️ Você já tem este mangá!");
    await supabase.from("mangas").insert([{ ...novoManga, usuario: usuarioAtual, ultima_leitura: new Date().toISOString() }]);
    setEstaAbertoAdd(false);
    buscarMangas();
  }

  // ==========================================
  // 🔑 7. LÓGICA DE PERFIS E PIN
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
      alert("❌ PIN Incorreto!");
      setPinDigitado("");
    }
  }

  function sairDoPerfil() {
    sessionStorage.removeItem('hunter_ativo');
    setUsuarioAtual(null);
  }

  if (!mestreAutorizado) return <AcessoMestre aoAutorizar={() => setMestreAutorizado(true)} />;
  if (carregando) return <div className="min-h-screen bg-[#040405] flex items-center justify-center text-zinc-500">Carregando...</div>;

  // ==========================================
  // 🖥️ 8. RENDERING: SELEÇÃO DE PERFIL
  // ==========================================
  if (!usuarioAtual) {
    return (
      <main className="min-h-screen bg-[#040405] flex flex-col items-center justify-center p-6 text-[#e5e5e5] relative">
        {perfilAlvoParaBloqueio && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            <div className="bg-[#0e0e11] border border-zinc-800 p-10 rounded-[3rem] shadow-2xl flex flex-col items-center max-w-sm w-full">
              <button onClick={() => setPerfilAlvoParaBloqueio(null)} className="absolute top-6 right-6 text-zinc-500">✕</button>
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-xl font-black text-white uppercase tracking-widest mb-6 text-center">Digite o PIN</h2>
              <input autoFocus type="password" maxLength={4} className="bg-zinc-950 border border-zinc-700 focus:border-red-500 rounded-2xl w-full py-4 text-center text-3xl font-black text-white outline-none mb-6" value={pinDigitado} onChange={(e) => setPinDigitado(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => e.key === 'Enter' && confirmarAcessoPin()} />
              <button onClick={confirmarAcessoPin} className="w-full bg-red-600 text-white font-black py-4 rounded-xl">Desbloquear</button>
            </div>
          </div>
        )}
        <h1 className="text-4xl font-black mb-16 text-white uppercase tracking-tighter">Quem está lendo?</h1>
        <div className="flex flex-wrap justify-center gap-10">
          {perfis.map(p => {
            const auraP = p.cor_tema?.startsWith('#') ? TEMAS.custom : (TEMAS[p.cor_tema as keyof typeof TEMAS] || TEMAS.verde);
            return (
              <div key={p.nome_original} onClick={() => tentarMudarPerfil(p.nome_original)} className="flex flex-col items-center gap-6 cursor-pointer group" style={p.cor_tema?.startsWith('#') ? { '--aura': p.cor_tema } as React.CSSProperties : {}}>
                <div className={`w-40 h-40 bg-zinc-900 rounded-[3rem] flex items-center justify-center text-7xl border-4 border-zinc-800 group-hover:${auraP.border} group-hover:${auraP.shadow} transition-all duration-300 relative`}>
                  {p.avatar}
                  {p.pin && <div className="absolute -top-2 -right-2 bg-red-600 w-10 h-10 rounded-full flex items-center justify-center text-lg border-4 border-[#040405]">🔒</div>}
                </div>
                <span className="text-zinc-500 font-black uppercase text-sm group-hover:text-white">{p.nome_exibicao}</span>
              </div>
            );
          })}
        </div>
      </main>
    );
  }

  // ==========================================
  // 🖥️ 9. RENDERING: ESTANTE (LOGADO)
  // ==========================================
  const perfilAtivo = perfis.find(p => p.nome_original === usuarioAtual) || { nome_exibicao: usuarioAtual, avatar: "👤", cor_tema: "verde" };
  const isCustom = perfilAtivo.cor_tema?.startsWith('#');
  const aura = isCustom ? TEMAS.custom : (TEMAS[perfilAtivo.cor_tema as keyof typeof TEMAS] || TEMAS.verde);
  const mangasFiltrados = mangas.filter(m => (filtroAtivo === "Todos" ? true : m.status === filtroAtivo)).filter(m => m.titulo.toLowerCase().includes(pesquisaInterna.toLowerCase()));

  return (
    <main className={`min-h-screen bg-[#0a0a0c] p-6 md:p-10 text-[#e5e5e5]`} style={isCustom ? { '--aura': perfilAtivo.cor_tema } as React.CSSProperties : {}}>
      
      {/* HEADER RECUPERADO COM BOTÕES DE BACKUP E STATS */}
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-50">
        <section>
          <h1 className="text-3xl font-bold tracking-tight">Estante de Mangás</h1>
          <div className="flex gap-3 mt-4">
            {perfis.map(p => (
              <button key={p.nome_original} onClick={() => tentarMudarPerfil(p.nome_original)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold border transition-all ${usuarioAtual === p.nome_original ? `${aura.bgActive} border-transparent text-white shadow-lg` : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"}`}>
                <span className="text-sm">{p.avatar}</span>
                <span className="uppercase tracking-widest">{p.nome_exibicao}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="flex gap-2 items-center flex-wrap">
          {/* SAIR E PERFIL */}
          <Link href="/perfil" className={`group flex items-center gap-3 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:${aura.border} transition-all`}>
            <div className={`w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-xl border border-zinc-800 group-hover:${aura.border}`}>{perfilAtivo.avatar}</div>
            <div className="flex flex-col"><span className="text-[10px] font-bold text-zinc-500 uppercase leading-none">Perfil</span><span className="text-xs font-black text-white">{perfilAtivo.nome_exibicao}</span></div>
          </Link>
          <button onClick={sairDoPerfil} className="px-4 py-3 bg-red-950/30 text-red-500 border border-red-900/50 rounded-2xl text-[10px] font-black uppercase">Sair 🚪</button>
          
          {/* BOTÃO ESTATÍSTICAS RECUPERADO */}
          <button onClick={() => setMostrarStats(!mostrarStats)} className={`px-4 py-3 rounded-xl font-bold border transition-all ${mostrarStats ? `${aura.bg} border-transparent text-white` : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>📊</button>

          {/* MENU DE BACKUP RECUPERADO */}
          <div className="relative">
            <button onClick={() => setMenuDados(!menuDados)} className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all ${menuDados ? 'bg-zinc-800 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>⚙️</button>
            {menuDados && (
              <div className="absolute top-14 right-0 w-48 bg-[#18181b] border border-zinc-800 rounded-xl shadow-2xl z-[100] overflow-hidden">
                <button onClick={() => { const data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(mangas)); const link = document.createElement('a'); link.href = data; link.download = "backup.json"; link.click(); setMenuDados(false); }} className="w-full p-4 text-left text-[10px] font-bold uppercase hover:bg-zinc-800 border-b border-zinc-800">📥 Exportar</button>
                <button onClick={() => { fileInputRef.current?.click(); setMenuDados(false); }} className="w-full p-4 text-left text-[10px] font-bold uppercase hover:bg-zinc-800">📤 Importar</button>
                <input type="file" ref={fileInputRef} onChange={(e) => { const reader = new FileReader(); reader.onload = async (ev: any) => { const list = JSON.parse(ev.target.result); await supabase.from("mangas").insert(list.map(({id, ...rest}: any) => ({...rest, usuario: usuarioAtual}))); buscarMangas(); }; reader.readAsText(e.target.files![0]); }} className="hidden" accept=".json" />
              </div>
            )}
          </div>
          
          {/* BOTÃO ADICIONAR (CORRIGIDO VISUALMENTE) */}
          <button onClick={() => setEstaAbertoAdd(true)} className={`px-6 py-3 bg-white text-black rounded-xl font-bold transition-all shadow-xl whitespace-nowrap hover:bg-[var(--aura)] hover:text-white`} style={isCustom ? { '--aura': perfilAtivo.cor_tema } as React.CSSProperties : {}}>
            + Adicionar Obra
          </button>
        </section>
      </header>

      {/* SEÇÃO DE ESTATÍSTICAS RECUPERADA */}
      {mostrarStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-6 bg-[#111114] rounded-xl border border-zinc-800 animate-in fade-in">
          <div className="flex flex-col"><span className="text-zinc-500 text-[10px] font-bold uppercase">Obras</span><span className={`text-2xl font-bold ${aura.text}`}>{mangasFiltrados.length}</span></div>
          <div className="flex flex-col"><span className="text-zinc-500 text-[10px] font-bold uppercase">Caps. Lidos</span><span className="text-2xl font-bold text-white">{mangasFiltrados.reduce((a, b) => a + (b.capitulo_atual || 0), 0)}</span></div>
        </div>
      )}

      {/* FILTROS E BUSCA */}
      <div className={`transition-all duration-500 ${estaAbertoAdd || mangaDetalhe || perfilAlvoParaBloqueio ? "blur-md opacity-20 pointer-events-none" : ""}`}>
        <div className="mb-6"><input type="text" placeholder="🔍 Buscar..." className={`w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-sm outline-none ${aura.focus}`} value={pesquisaInterna} onChange={(e) => setPesquisaInterna(e.target.value)} /></div>
        <nav className="flex gap-6 mb-10 border-b border-zinc-900 overflow-x-auto">
          {["Lendo", "Planejo Ler", "Completos", "Dropados", "Todos"].map(s => (
            <button key={s} onClick={() => setFiltroAtivo(s)} className={`text-xs font-bold relative pb-4 transition-all ${filtroAtivo === s ? aura.text : "text-zinc-500 hover:text-zinc-300"}`}>
              {s}
              {filtroAtivo === s && <div className={`absolute bottom-0 w-full h-1 ${aura.bg} shadow-[0_0_10px_var(--aura)]`} />}
            </button>
          ))}
        </nav>

        {/* LISTA DE MANGÁS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {mangasFiltrados.map(m => (
            <MangaCard key={m.id} manga={m} atualizarCapitulo={atualizarCapitulo} deletarManga={(id) => { if(confirm("Excluir?")) supabase.from("mangas").delete().eq("id", id).then(buscarMangas) }} mudarStatusManual={(id, s) => atualizarDados(id, {status: s})} abrirDetalhes={(m) => setMangaDetalhe(m as Manga)} aura={aura} />
          ))}
        </div>
      </div>
      
      {/* MODAIS */}
      <AddMangaModal estaAberto={estaAbertoAdd} fechar={() => setEstaAbertoAdd(false)} usuarioAtual={usuarioAtual} aoSalvar={salvarNovaObra} />
      <MangaDetailsModal manga={mangaDetalhe} aoFechar={() => setMangaDetalhe(null)} aoAtualizarCapitulo={atualizarCapitulo} aoAtualizarDados={atualizarDados} aoDeletar={(id) => { if(confirm("Excluir?")) supabase.from("mangas").delete().eq("id", id).then(() => { setMangaDetalhe(null); buscarMangas(); }) }} />
    </main>
  );
}