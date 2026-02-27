"use client";

// ==========================================
// 📦 1. IMPORTAÇÕES E INTERFACES
// ==========================================
import AcessoMestre from "./components/AcessoMestre";
import { supabase } from "./supabase";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import MangaCard from "./components/MangaCard";
import AddMangaModal from "./components/AddMangaModal";
import MangaDetailsModal from "./components/MangaDetailsModal";

// Definindo a interface Manga para o TypeScript não reclamar
interface Manga { 
  id: number; 
  titulo: string; 
  capa: string; 
  capitulo_atual: number; 
  total_capitulos: number; 
  status: string; 
  sinopse: string; 
  nota_pessoal: number; 
  nota_amigos: number; 
  comentarios: string; 
  usuario: string; 
  ultima_leitura: string; 
  favorito: boolean; 
}

// ==========================================
// 🎨 2. DICIONÁRIO DE AURAS (TEMAS)
// ==========================================
const TEMAS = {
  verde: { nome: "Verde Néon", bg: "bg-green-500", bgActive: "bg-green-600", text: "text-green-500", border: "border-green-500", shadow: "shadow-[0_0_20px_rgba(34,197,94,0.3)]", focus: "focus:border-green-500" },
  azul: { nome: "Azul Elétrico", bg: "bg-blue-500", bgActive: "bg-blue-600", text: "text-blue-500", border: "border-blue-500", shadow: "shadow-[0_0_20px_rgba(59,130,246,0.3)]", focus: "focus:border-blue-500" },
  roxo: { nome: "Roxo Carmesim", bg: "bg-purple-500", bgActive: "bg-purple-600", text: "text-purple-500", border: "border-purple-500", shadow: "shadow-[0_0_20px_rgba(168,85,247,0.3)]", focus: "focus:border-purple-500" },
  laranja: { nome: "Laranja Outono", bg: "bg-orange-500", bgActive: "bg-orange-600", text: "text-orange-500", border: "border-orange-500", shadow: "shadow-[0_0_20px_rgba(249,115,22,0.3)]", focus: "focus:border-orange-500" },
  admin: { nome: "Admin", bg: "bg-yellow-500", bgActive: "bg-yellow-600", text: "text-yellow-500", border: "border-yellow-500", shadow: "shadow-[0_0_20px_rgba(234,179,8,0.3)]", focus: "focus:border-yellow-500" },
  custom: { nome: "Cor Livre", bg: "bg-[var(--aura)]", bgActive: "bg-[var(--aura)] brightness-110", text: "text-[var(--aura)]", border: "border-[var(--aura)]", shadow: "shadow-[0_0_15px_var(--aura)]", focus: "focus:border-[var(--aura)]" }
};

export default function Home() {
  // ==========================================
  // 🔐 3. ESTADOS DE SEGURANÇA E ACESSO
  // ==========================================
  const [mestreAutorizado, setMestreAutorizado] = useState(false);
  const [usuarioAtual, setUsuarioAtual] = useState<string | null>(null);
  const [perfilAlvoParaBloqueio, setPerfilAlvoParaBloqueio] = useState<string | null>(null);
  const [pinDigitado, setPinDigitado] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // ==========================================
  // 📦 4. ESTADOS DE DADOS E INTERFACE
  // ==========================================
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [perfis, setPerfis] = useState<any[]>([]); 
  const [estaAbertoAdd, setEstaAbertoAdd] = useState(false);
  const [mangaDetalhe, setMangaDetalhe] = useState<Manga | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [filtroAtivo, setFiltroAtivo] = useState("Lendo");
  const [pesquisaInterna, setPesquisaInterna] = useState("");

  // ==========================================
  // 🔄 5. LÓGICA DE INICIALIZAÇÃO (F5)
  // ==========================================
  useEffect(() => { 
    const mestre = sessionStorage.getItem("acesso_mestre");
    if (mestre === "true") setMestreAutorizado(true);
    setUsuarioAtual(null);
    buscarPerfis().then(() => setCarregando(false));
  }, []);

  useEffect(() => {
    if (usuarioAtual) {
      setIsAdmin(usuarioAtual === "Admin");
      buscarMangas();
    }
  }, [usuarioAtual]);

  // ==========================================
  // 🛠️ 6. FUNÇÕES DO BANCO DE DADOS (RECUPERADAS)
  // ==========================================
  async function buscarMangas() {
    if (!usuarioAtual || usuarioAtual === "Admin") return;
    const { data } = await supabase.from("mangas").select("*").eq("usuario", usuarioAtual).order("ultima_leitura", { ascending: false });
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
    
    await supabase.from("mangas").update({ 
      capitulo_atual: novo, 
      status: novoStatus, 
      ultima_leitura: new Date().toISOString() 
    }).eq("id", manga.id);
    
    buscarMangas();
  }

  async function atualizarDados(id: number, campos: any) {
    await supabase.from("mangas").update(campos).eq("id", id);
    setMangas(prev => prev.map(m => m.id === id ? { ...m, ...campos } : m));
    if (mangaDetalhe?.id === id) setMangaDetalhe(prev => prev ? { ...prev, ...campos } : null);
  }

  // ==========================================
  // 🔑 7. LÓGICA DE PERFIS E PIN
  // ==========================================
  function tentarMudarPerfil(nome: string) {
    const info = perfis.find(p => p.nome_original === nome);
    if (info?.pin) {
      setPerfilAlvoParaBloqueio(nome);
      setPinDigitado("");
    } else {
      setUsuarioAtual(nome);
    }
  }

  function confirmarPin() {
    const info = perfis.find(p => p.nome_original === perfilAlvoParaBloqueio);
    if (info && info.pin === pinDigitado) {
      setUsuarioAtual(perfilAlvoParaBloqueio);
      setPerfilAlvoParaBloqueio(null);
    } else {
      alert("PIN Incorreto!");
    }
  }

  // ==========================================
  // 🖥️ 8. RENDERING: ACESSO MESTRE
  // ==========================================
  if (!mestreAutorizado) return <AcessoMestre aoAutorizar={() => setMestreAutorizado(true)} />;
  if (carregando) return <div className="min-h-screen bg-[#040405] flex items-center justify-center text-zinc-500 font-bold uppercase">Carregando...</div>;

  // ==========================================
  // 🖥️ 9. RENDERING: SELEÇÃO DE PERFIL / ADMIN
  // ==========================================
  if (!usuarioAtual) {
    return (
      <main className="min-h-screen bg-[#040405] flex flex-col items-center justify-center p-6 text-white">
        <h1 className="text-4xl font-black mb-16 uppercase tracking-tighter">Escolha seu Perfil</h1>
        <div className="flex flex-wrap justify-center gap-10">
          {perfis.map(p => {
            const auraP = p.cor_tema?.startsWith('#') ? TEMAS.custom : (TEMAS[p.cor_tema as keyof typeof TEMAS] || TEMAS.verde);
            return (
              <div key={p.nome_original} onClick={() => tentarMudarPerfil(p.nome_original)} className="flex flex-col items-center gap-4 cursor-pointer group" style={p.cor_tema?.startsWith('#') ? { '--aura': p.cor_tema } as React.CSSProperties : {}}>
                <div className={`w-40 h-40 bg-zinc-900 rounded-[3rem] flex items-center justify-center text-7xl border-4 border-zinc-800 group-hover:${auraP.border} transition-all`}>
                  {p.avatar}
                </div>
                <span className="font-bold uppercase text-zinc-500 group-hover:text-white">{p.nome_exibicao}</span>
              </div>
            );
          })}
          {/* PERFIL ADMINISTRADOR */}
          <div onClick={() => tentarMudarPerfil("Admin")} className="flex flex-col items-center gap-4 cursor-pointer group">
            <div className="w-40 h-40 bg-zinc-900 border-4 border-dashed border-zinc-700 rounded-[3rem] flex items-center justify-center text-7xl group-hover:border-yellow-500 transition-all">
              ⚙️
            </div>
            <span className="font-bold uppercase text-zinc-700 group-hover:text-yellow-500 text-xs">Administrador</span>
          </div>
        </div>

        {perfilAlvoParaBloqueio && (
          <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-zinc-900 p-10 rounded-[2.5rem] border border-zinc-800 text-center max-w-sm w-full">
              <h2 className="text-white font-black mb-6 uppercase tracking-widest text-xl">PIN de Segurança</h2>
              <input autoFocus type="password" maxLength={4} className="bg-black border border-zinc-700 rounded-xl w-full py-4 text-center text-3xl text-white outline-none mb-6" value={pinDigitado} onChange={(e) => setPinDigitado(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => e.key === 'Enter' && confirmarPin()} />
              <button onClick={confirmarPin} className="w-full py-4 bg-white text-black rounded-xl font-black uppercase">Entrar</button>
            </div>
          </div>
        )}
      </main>
    );
  }

  // ==========================================
  // 🖥️ 10. ESTANTE DE MANGÁS OU MODO ADMIN
  // ==========================================
  if (isAdmin) {
    return (
      <main className="min-h-screen bg-black text-white p-10">
        <h1 className="text-3xl font-black uppercase text-yellow-500 mb-6">Modo Construtor (Wix)</h1>
        <button onClick={() => setUsuarioAtual(null)} className="px-6 py-2 bg-zinc-900 rounded-xl">Voltar</button>
      </main>
    );
  }

  const perfilAtivo = perfis.find(p => p.nome_original === usuarioAtual) || { nome_exibicao: usuarioAtual, avatar: "👤", cor_tema: "verde" };
  const aura = perfilAtivo.cor_tema?.startsWith('#') ? TEMAS.custom : (TEMAS[perfilAtivo.cor_tema as keyof typeof TEMAS] || TEMAS.verde);
  const mangasFiltrados = mangas.filter(m => (filtroAtivo === "Todos" ? true : m.status === filtroAtivo)).filter(m => m.titulo.toLowerCase().includes(pesquisaInterna.toLowerCase()));

  return (
    <main className={`min-h-screen bg-[#080808] p-6 md:p-12 text-white`} style={perfilAtivo.cor_tema?.startsWith('#') ? { '--aura': perfilAtivo.cor_tema } as React.CSSProperties : {}}>
      <header className="flex justify-between items-end mb-16">
        <h1 className="text-5xl font-black italic tracking-tighter">Hunter<span className={aura.text}>.</span>Tracker</h1>
        <div className="flex items-center gap-6">
          <button onClick={() => setEstaAbertoAdd(true)} className={`${aura.bg} px-6 py-3 rounded-xl font-black uppercase text-xs shadow-lg`}>+ Add Manga</button>
          <div onClick={() => setUsuarioAtual(null)} className="cursor-pointer text-center">
            <div className={`w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center text-2xl border-2 ${aura.border}`}>{perfilAtivo.avatar}</div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
        {mangasFiltrados.map(m => (
          <MangaCard 
            key={m.id} 
            manga={m} 
            aura={aura}
            atualizarCapitulo={atualizarCapitulo} 
            deletarManga={(id) => { if(confirm("Excluir?")) supabase.from("mangas").delete().eq("id", id).then(buscarMangas) }} 
            mudarStatusManual={(id, s) => atualizarDados(id, {status: s})} 
            abrirDetalhes={(m) => setMangaDetalhe(m as Manga)} 
          />
        ))}
      </div>

      <AddMangaModal estaAberto={estaAbertoAdd} fechar={() => setEstaAbertoAdd(false)} usuarioAtual={usuarioAtual} aoSalvar={buscarMangas} />
      <MangaDetailsModal manga={mangaDetalhe} aoFechar={() => setMangaDetalhe(null)} aoAtualizarCapitulo={atualizarCapitulo} aoAtualizarDados={atualizarDados} aoDeletar={(id) => { if(confirm("Excluir?")) supabase.from("mangas").delete().eq("id", id).then(() => { setMangaDetalhe(null); buscarMangas(); }) }} />
    </main>
  );
}