"use client";

import { useState, useEffect } from "react";
import { supabase } from "./supabase"; 
import AddMangaModal from "./components/AddMangaModal";
import MangaDetailsModal from "./components/MangaDetailsModal";

const USUARIOS = [
  { id: 1, nome: "Baiaku", pin: "1234", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Baiaku", aura: "verde" },
  { id: 2, nome: "Hunter", pin: "0000", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Hunter", aura: "roxo" },
  { id: 3, nome: "Visitante", pin: "1111", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Guest", aura: "azul" },
];

const AURAS: any = {
  verde: { bg: "bg-green-500", text: "text-green-500", border: "border-green-500/50", shadow: "shadow-[0_0_40px_rgba(34,197,94,0.2)]", focus: "focus:border-green-500" },
  roxo: { bg: "bg-purple-600", text: "text-purple-500", border: "border-purple-500/50", shadow: "shadow-[0_0_40px_rgba(147,51,234,0.2)]", focus: "focus:border-purple-500" },
  azul: { bg: "bg-blue-600", text: "text-blue-500", border: "border-blue-500/50", shadow: "shadow-[0_0_40px_rgba(37,99,235,0.2)]", focus: "focus:border-blue-500" },
};

export default function Home() {
  const [autenticado, setAutenticado] = useState(false);
  const [senhaMestra, setSenhaMestra] = useState("");
  const [usuarioAtual, setUsuarioAtual] = useState<any>(null);
  const [perfilTentativa, setPerfilTentativa] = useState<any>(null);
  const [pinDigitado, setPinDigitado] = useState("");

  const [mangas, setMangas] = useState<any[]>([]);
  const [estaAbertoAdd, setEstaAbertoAdd] = useState(false);
  const [mangaDetalhe, setMangaDetalhe] = useState<any>(null);

  // --- LOGICA DE PERSISTÊNCIA E RESET NO F5 ---
  useEffect(() => {
    // 1. Verifica se a senha mestra já foi validada antes
    const jaLogado = sessionStorage.getItem("hunter_tracker_auth");
    if (jaLogado === "true") {
      setAutenticado(true);
    }

    // 2. IMPORTANTE: Sempre resetamos o usuário no F5.
    // Assim, o site volta para a tela "Quem está lendo?" e exige o PIN.
    setUsuarioAtual(null);
  }, []);

  useEffect(() => {
    if (usuarioAtual) {
      buscarMangas();
    }
  }, [usuarioAtual]);

  async function buscarMangas() {
    const { data } = await supabase
      .from("mangas")
      .select("*")
      .eq("usuario_id", usuarioAtual.id)
      .order("created_at", { ascending: false });
    setMangas(data || []);
  }

  function loginMestre() {
    if (senhaMestra === "YHRyf(V46_F2") {
      setAutenticado(true);
      // Salva que a senha mestra está ok para esta aba
      sessionStorage.setItem("hunter_tracker_auth", "true");
    } else {
      alert("Senha Mestra incorreta!");
    }
  }

  function abrirPromptPin(usuario: any) {
    setPerfilTentativa(usuario);
    setPinDigitado("");
  }

  function verificarPin() {
    if (pinDigitado === perfilTentativa.pin) {
      setUsuarioAtual(perfilTentativa);
      setPerfilTentativa(null);
    } else {
      alert("PIN Incorreto, Hunter!");
      setPinDigitado("");
    }
  }

  async function salvarNovaObra(novaObra: any) {
    const { data, error } = await supabase
      .from("mangas")
      .insert([{ ...novaObra, usuario_id: usuarioAtual.id }])
      .select();
    
    if (!error) {
      setMangas([data[0], ...mangas]);
      setEstaAbertoAdd(false);
    }
  }

  async function atualizarDados(id: string, novosDados: any) {
    const { error } = await supabase.from("mangas").update(novosDados).eq("id", id);
    if (!error) {
      setMangas(mangas.map(m => m.id === id ? { ...m, ...novosDados } : m));
      if (mangaDetalhe?.id === id) setMangaDetalhe({ ...mangaDetalhe, ...novosDados });
    }
  }

  async function deletarManga(id: string) {
    if (confirm("Deseja mesmo remover esta obra?")) {
      const { error } = await supabase.from("mangas").delete().eq("id", id);
      if (!error) {
        setMangas(mangas.filter(m => m.id !== id));
        setMangaDetalhe(null);
      }
    }
  }

  const aura = AURAS[usuarioAtual?.aura || perfilTentativa?.aura || "verde"];

  if (!autenticado) {
    return (
      <main className="h-screen bg-black flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <h1 className="text-white text-3xl font-black uppercase tracking-[0.2em] mb-8 italic">Estante Hunter</h1>
          <input 
            type="password" 
            placeholder="SENHA MESTRA" 
            className="w-full bg-zinc-900 border border-zinc-800 p-5 rounded-2xl text-white text-center outline-none focus:border-white/50 transition-all mb-4"
            value={senhaMestra}
            onChange={(e) => setSenhaMestra(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loginMestre()}
          />
          <button onClick={loginMestre} className="w-full bg-white text-black font-black py-4 rounded-2xl uppercase tracking-widest hover:bg-zinc-200 transition-all">Entrar</button>
        </div>
      </main>
    );
  }

  if (!usuarioAtual) {
    return (
      <main className="h-screen bg-[#050505] flex flex-col items-center justify-center p-6">
        <h2 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.5em] mb-12">Quem está lendo?</h2>
        <div className="flex gap-12">
          {USUARIOS.map(u => (
            <div key={u.id} onClick={() => abrirPromptPin(u)} className="group cursor-pointer text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-transparent group-hover:border-white transition-all mb-4">
                <img src={u.avatar} alt={u.nome} className="w-full h-full object-cover grayscale group-hover:grayscale-0" />
              </div>
              <p className="text-zinc-500 group-hover:text-white font-bold uppercase text-[10px] tracking-widest">{u.nome}</p>
            </div>
          ))}
        </div>

        {perfilTentativa && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md">
            <div className="bg-zinc-900 border border-white/10 p-10 rounded-[3rem] w-80 text-center shadow-2xl">
              <img src={perfilTentativa.avatar} className="w-20 h-20 rounded-full mx-auto mb-6" />
              <p className="text-white font-black uppercase text-xs mb-6">PIN de {perfilTentativa.nome}</p>
              <input 
                autoFocus
                type="password" 
                maxLength={4}
                value={pinDigitado}
                onChange={(e) => setPinDigitado(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && verificarPin()}
                className={`w-full bg-black border border-zinc-800 rounded-2xl py-4 text-center text-2xl text-white outline-none ${aura.focus}`}
              />
              <button onClick={() => setPerfilTentativa(null)} className="mt-6 text-zinc-600 uppercase text-[10px] font-bold hover:text-white">Cancelar</button>
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white p-6 md:p-12">
      <header className="flex justify-between items-end mb-16 max-w-7xl mx-auto">
        <div>
          <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-2 ${aura.text}`}>Estante Pessoal</p>
          <h1 className="text-5xl font-black uppercase italic tracking-tighter">Hunter<span className={aura.text}>.</span>Tracker</h1>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => setEstaAbertoAdd(true)} className={`${aura.bg} p-4 rounded-2xl shadow-lg hover:scale-105 transition-all`}>
            <span className="font-black uppercase text-[10px] tracking-widest px-4">Add Manga</span>
          </button>
          {/* Botão de sair limpa o usuario E a senha mestra da sessão */}
          <div onClick={() => {
            setUsuarioAtual(null);
            setAutenticado(false);
            sessionStorage.removeItem("hunter_tracker_auth");
          }} className="cursor-pointer group">
            <img src={usuarioAtual.avatar} className={`w-12 h-12 rounded-full border-2 ${aura.border} group-hover:scale-110 transition-all`} />
          </div>
        </div>
      </header>

      {/* ... Resto do grid (mantido igual) ... */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 max-w-7xl mx-auto">
        {mangas.map(m => (
          <div key={m.id} onClick={() => setMangaDetalhe(m)} className="group cursor-pointer relative">
            <div className={`aspect-[3/4.5] rounded-[2rem] overflow-hidden border border-white/5 transition-all group-hover:border-white/20 ${aura.shadow}`}>
              <img src={m.capa} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={m.titulo} />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="font-black uppercase text-[10px] leading-tight line-clamp-2">{m.titulo}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AddMangaModal estaAberto={estaAbertoAdd} fechar={() => setEstaAbertoAdd(false)} usuarioAtual={usuarioAtual} aoSalvar={salvarNovaObra} aura={aura} />
      <MangaDetailsModal manga={mangaDetalhe} aoFechar={() => setMangaDetalhe(null)} aoAtualizarDados={atualizarDados} aoDeletar={deletarManga} aura={aura} />
    </main>
  );
}