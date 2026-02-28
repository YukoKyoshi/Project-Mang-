"use client";

import { supabase } from "../supabase";
import { useEffect, useState } from "react";
import Link from "next/link";

// 🎨 DICIONÁRIO DE AURAS (Para não ficar travado no azul)
const TEMAS = {
  verde: { bg: "bg-green-500", text: "text-green-500", border: "border-green-500", shadow: "shadow-[0_0_40px_rgba(34,197,94,0.3)]", button: "bg-green-500 hover:bg-green-600", focus: "focus:border-green-500" },
  azul: { bg: "bg-blue-500", text: "text-blue-500", border: "border-blue-500", shadow: "shadow-[0_0_40px_rgba(59,130,246,0.3)]", button: "bg-blue-500 hover:bg-blue-600", focus: "focus:border-blue-500" },
  roxo: { bg: "bg-purple-500", text: "text-purple-500", border: "border-purple-500", shadow: "shadow-[0_0_40px_rgba(168,85,247,0.3)]", button: "bg-purple-500 hover:bg-purple-600", focus: "focus:border-purple-500" },
  laranja: { bg: "bg-orange-500", text: "text-orange-500", border: "border-orange-500", shadow: "shadow-[0_0_40px_rgba(249,115,22,0.3)]", button: "bg-orange-500 hover:bg-orange-600", focus: "focus:border-orange-500" },
  custom: { bg: "bg-[var(--aura)]", text: "text-[var(--aura)]", border: "border-[var(--aura)]", shadow: "shadow-[0_0_40px_var(--aura)]", button: "bg-[var(--aura)] brightness-110", focus: "focus:border-[var(--aura)]" }
};

export default function PerfilPage() {
  const [usuarioAtivo, setUsuarioAtivo] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  
  const [dadosPerfil, setDadosPerfil] = useState({ 
    nome: "", avatar: "👤", pin: "", tema: "azul", anilist_token: null 
  });
  
  const [stats, setStats] = useState({ obras: 0, caps: 0, finais: 0 });
  const [elo, setElo] = useState({ tier: "BRONZE", sub: "IV" });

  // 🛡️ SEGURANÇA E INICIALIZAÇÃO
  useEffect(() => {
    const mestre = sessionStorage.getItem("estante_acesso") || sessionStorage.getItem("acesso_mestre");
    const hunter = sessionStorage.getItem("hunter_ativo");

    if (mestre !== "true" || !hunter) {
      window.location.href = '/';
      return;
    }
    setUsuarioAtivo(hunter);
  }, []);

  useEffect(() => {
    if (usuarioAtivo) carregarDados();
  }, [usuarioAtivo]);

  // 🔄 BUSCA DE DADOS
  async function carregarDados() {
    const { data: mangas } = await supabase.from("mangas").select("*").eq("usuario", usuarioAtivo);
    const { data: perfil } = await supabase.from("perfis").select("*").eq("nome_original", usuarioAtivo).single();

    if (mangas) {
      const totalObras = mangas.length;
      setStats({
        obras: totalObras,
        caps: mangas.reduce((acc, m) => acc + (m.capitulo_atual || 0), 0),
        finais: mangas.filter(m => m.status === "Completos").length
      });
      
      // Cálculo de Rank sincronizado (100 = Diamante)
      if (totalObras >= 250) setElo({ tier: "DIVINO", sub: "TOP" });
      else if (totalObras >= 200) setElo({ tier: "IMORTAL", sub: "I" });
      else if (totalObras >= 150) setElo({ tier: "MESTRE", sub: "I" });
      else if (totalObras >= 100) setElo({ tier: "DIAMANTE", sub: "II" });
      else if (totalObras >= 70) setElo({ tier: "PLATINA", sub: "III" });
      else if (totalObras >= 40) setElo({ tier: "OURO", sub: "I" });
      else if (totalObras >= 20) setElo({ tier: "PRATA", sub: "II" });
      else setElo({ tier: "BRONZE", sub: "IV" });
    }

    if (perfil) {
      setDadosPerfil({
        nome: perfil.nome_exibicao || usuarioAtivo!,
        avatar: perfil.avatar || "👤",
        pin: perfil.pin || "",
        tema: perfil.cor_tema || "azul",
        anilist_token: perfil.anilist_token || null
      });
    }
    setCarregando(false);
  }

  // 💾 SALVAR PIN
  async function salvarPin() {
    const { error } = await supabase.from("perfis").update({ pin: dadosPerfil.pin }).eq("nome_original", usuarioAtivo);
    if (!error) alert("PIN atualizado com sucesso!");
    else alert("Erro ao salvar PIN.");
  }

  function fazerLogout() {
    sessionStorage.removeItem('hunter_ativo');
    window.location.href = '/';
  }

  if (carregando) return <div className="min-h-screen bg-[#040405] flex items-center justify-center text-white font-black italic animate-pulse">CARREGANDO HUNTER...</div>;

  const isCustom = dadosPerfil.tema?.startsWith('#');
  const aura = isCustom ? TEMAS.custom : (TEMAS[dadosPerfil.tema as keyof typeof TEMAS] || TEMAS.azul);

  return (
    <main 
      className="min-h-screen bg-[#040405] flex flex-col items-center justify-center p-6 font-sans relative"
      style={isCustom ? { '--aura': dadosPerfil.tema } as React.CSSProperties : {}}
    >
      
      {/* BOTÃO VOLTAR (FORA DO CARD) */}
      <Link href="/" className="absolute top-10 left-10 text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">
        ← Voltar para Estante
      </Link>

      {/* 💳 CARTÃO DE CAÇADOR (Exatamente igual ao Modal) */}
      <div className={`w-full max-w-[460px] bg-[#0e0e11] rounded-[3rem] p-10 border border-white/5 ${aura.shadow} flex flex-col items-center relative transition-shadow duration-700`}>
        
        {/* AVATAR */}
        <div className={`w-20 h-20 bg-zinc-950 rounded-[1.2rem] flex items-center justify-center text-4xl border-2 ${aura.border} shadow-lg mb-4`}>
          {dadosPerfil.avatar}
        </div>

        {/* INFO PRINCIPAL */}
        <h1 className="text-2xl font-black text-white uppercase tracking-wider mb-1">{dadosPerfil.nome}</h1>
        <p className={`text-[11px] font-black ${aura.text} uppercase tracking-[0.3em] mb-1`}>RANK: {elo.tier}</p>
        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-8">PODER DE LEITURA: {stats.caps} CAPÍTULOS</p>

        {/* ABAS (Visualmente fiéis ao print) */}
        <div className="flex gap-8 border-b border-zinc-800/50 w-full justify-center pb-4 mb-8">
          <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${aura.text}`}>HUNTER STATUS</span>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">ACHIEVEMENTS</span>
        </div>

        {/* GRID DE ESTATÍSTICAS MENOR */}
        <div className="grid grid-cols-3 gap-3 w-full mb-8">
          {[
            { label: "OBRAS", val: stats.obras },
            { label: "CAPÍTULOS", val: stats.caps },
            { label: "FINAIS", val: stats.finais }
          ].map(s => (
            <div key={s.label} className="bg-black/50 border border-zinc-800/50 rounded-2xl py-5 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-white italic tracking-tighter leading-none">{s.val}</span>
              <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mt-2">{s.label}</span>
            </div>
          ))}
        </div>

        {/* INTEGRAÇÃO ANILIST */}
        <div className="w-full mb-6">
          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">Integração Externa</p>
          {dadosPerfil.anilist_token ? (
            <div className={`w-full border border-green-500/30 bg-green-500/10 rounded-xl py-4 flex justify-center items-center gap-2`}>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">AniList Sincronizado</span>
            </div>
          ) : (
            <button 
              onClick={() => window.location.href = '/api/auth/anilist'}
              className="w-full bg-[#02a9ff] hover:bg-[#008dff] text-white rounded-xl py-4 flex justify-center items-center gap-2 transition-all active:scale-95"
            >
              <img src="https://anilist.co/img/icons/icon.svg" className="w-3 h-3 invert" alt="" />
              <span className="text-[10px] font-black uppercase tracking-widest">Conectar AniList</span>
            </button>
          )}
        </div>

        {/* CONFIGURAÇÃO DE PIN */}
        <div className="w-full mb-8">
          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">PIN DE ACESSO</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input 
                type="password" 
                maxLength={4}
                value={dadosPerfil.pin}
                onChange={(e) => setDadosPerfil({...dadosPerfil, pin: e.target.value.replace(/\D/g, '')})}
                className={`w-full bg-black border border-zinc-800 rounded-xl py-4 text-center text-white font-black tracking-[0.5em] outline-none ${aura.focus} transition-colors`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 text-xs">🛡️</span>
            </div>
            <button 
              onClick={salvarPin}
              className={`px-8 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-95 ${aura.button}`}
            >
              SALVAR
            </button>
          </div>
        </div>

        {/* BOTÃO SAIR DO PERFIL */}
        <button 
          onClick={fazerLogout}
          className="w-full py-4 rounded-xl border border-zinc-800/50 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white hover:border-zinc-600 transition-all"
        >
          SAIR DO PERFIL
        </button>

      </div>
    </main>
  );
}