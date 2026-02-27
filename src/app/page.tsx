"use client";

import { useState, useEffect } from "react";
import { supabase } from "./supabase"; 
import AddMangaModal from "./components/AddMangaModal";
import MangaDetailsModal from "./components/MangaDetailsModal";

// --- CONFIGURAÇÃO DE USUÁRIOS ---
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
  // --- ESTADOS DE SEGURANÇA (OBRIGATÓRIO COMECAR RESETADO) ---
  const [autenticado, setAutenticado] = useState(false); 
  const [senhaMestra, setSenhaMestra] = useState("");
  
  // Aqui estava o provável erro: Verifique se não há nada entre os parênteses do null
  const [usuarioAtual, setUsuarioAtual] = useState<any>(null); 
  const [perfilTentativa, setPerfilTentativa] = useState<any>(null);
  const [pinDigitado, setPinDigitado] = useState("");

  const [mangas, setMangas] = useState<any[]>([]);
  const [estaAbertoAdd, setEstaAbertoAdd] = useState(false);
  const [mangaDetalhe, setMangaDetalhe] = useState<any>(null);

  // --- TRAVA DE SEGURANÇA EXTRA ---
  // Este efeito roda UMA VEZ quando a página abre. Ele garante que os estados estejam limpos.
  useEffect(() => {
    setUsuarioAtual(null);
    setPerfilTentativa(null);
    setAutenticado(false);
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
    if (senhaMestra === "Hunter123") setAutenticado(true);
    else alert("Senha Mestra incorreta!");
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

  // --- OPERAÇÕES ---
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
    if (confirm("Deseja mesmo remover?")) {
      const { error } = await supabase.from("mangas").delete().eq("id", id);
      if (!error) {
        setMangas(mangas.filter(m => m.id !== id));
        setMangaDetalhe(null);
      }
    }
  }

  const aura = AURAS[usuarioAtual?.aura || perfilTentativa?.aura || "verde"];

  // TELA 1: ACESSO MESTRE
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

  // TELA 2: SELEÇÃO DE PERFIL
  if (!usuarioAtual) {
    return (
      <main className="h-screen bg-[#050505] flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
        <h2 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.5em] mb-12">Quem está lendo?</h2>
        <div className="flex flex-wrap justify-center gap-12">
          {USUARIOS.map(u => (
            <div key={u.id} onClick={() => abrirPromptPin(u)} className="group cursor-pointer text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-transparent group-hover:border-white transition-all mb-4 relative">
                <img src={u.avatar} alt={u.nome} className="w-full h-full object-cover grayscale group-hover:grayscale-0" />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-all" />
              </div>
              <p className="text-zinc-500 group-hover:text-white font-bold uppercase text-[10px] tracking-widest">{u.nome}</p>
            </div>
          ))}
        </div>

        {perfilTentativa && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in zoom-in duration-300">
            <div className="bg-zinc-900 border border-white/10 p-10 rounded-[3rem] w-full max-w-xs text-center shadow-2xl">
              <img src={perfilTentativa.avatar} className="w-20 h-20 rounded-full mx-auto mb-6 border-2 border-white/10" />
              <p className="text-white font-black uppercase text-xs mb-6 tracking-widest">PIN de {perfilTentativa.nome}</p>
              <input 
                autoFocus
                type="password" 
                maxLength={4}
                value={pinDigitado}
                onChange={(e) => setPinDigitado(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && verificarPin()}
                className={`w-full bg-black border border-zinc-800 rounded-2xl py-4 text-center text-3xl text-white outline-none transition-all ${aura.focus}`}
              />
              <div className="mt-8 flex flex-col gap-4">
                <button onClick={verificarPin} className="w-full py-4 bg-white text-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-zinc-200 transition-all">Confirmar</button>
                <button onClick={() => setPerfilTentativa(null)} className="text-zinc-600 uppercase text-[10px] font-bold hover:text-white transition-colors">Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  // TELA 3: ESTANTE
  return (
    <main className="min-h-screen bg-[#080808] text-white p-6 md:p-12 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-center md:items-end mb-16 max-w-7xl mx-auto gap-8">
        <div>
          <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-2 ${aura.text}`}>Estante Pessoal</p>
          <h1 className="text-5xl font-black uppercase italic tracking-tighter">Hunter<span className={aura.text}>.</span>Tracker</h1>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => setEstaAbertoAdd(true)} className={`${aura.bg} px-8 py-4 rounded-2xl shadow-lg hover:scale-105 transition-all`}>
            <span className="font-black uppercase text-[10px] tracking-widest">Add Manga</span>
          </button>
          <div onClick={() => { setUsuarioAtual(null); setAutenticado(false); }} className="cursor-pointer group flex flex-col items-center gap-2">
            <img src={usuarioAtual.avatar} className={`w-12 h-12 rounded-full border-2 ${aura.border} group-hover:scale-110 transition-all shadow-lg`} />
            <span className="text-[8px] font-bold text-zinc-600 group-hover:text-white uppercase tracking-tighter">Sair</span>
          </div>
        </div>
      </header>

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