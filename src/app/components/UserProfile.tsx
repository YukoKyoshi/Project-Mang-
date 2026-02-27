"use client";
import React, { useState } from 'react';
import { supabase } from '../supabase';
import ColecaoTrofeus from './ColecaoTrofeus'; // Certifique-se que o caminho está correto

interface UserProfileProps {
  perfil: any;
  mangas: any[];
  aoFechar: () => void;
  aoAtualizar: () => void;
  setUsuarioAtual: (v: string | null) => void;
  aura: any; // Recebe a aura do page.tsx para os troféus brilharem na cor certa
}

export default function UserProfile({ perfil, mangas, aoFechar, aoAtualizar, setUsuarioAtual, aura }: UserProfileProps) {
  const [novoPin, setNovoPin] = useState(perfil.pin || "");
  const [salvando, setSalvando] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'perfil' | 'conquistas'>('perfil');

  // LÓGICA DE CÁLCULO DAS CONQUISTAS
  const totalObras = mangas.length;
  const totalCapitulos = mangas.reduce((acc, m) => acc + (m.capitulo_atual || 0), 0);
  const concluidos = mangas.filter(m => m.status === "Completos").length;
  const favoritos = mangas.filter(m => m.favorito).length;

  // --- NOVA LÓGICA DE RANKED AQUI ---
  const patentes = [
    { nome: "INICIANTE", min: 0, cor: "text-zinc-500" },
    { nome: "BRONZE", min: 100, cor: "text-orange-700" },
    { nome: "PRATA", min: 500, cor: "text-zinc-300" },
    { nome: "OURO", min: 1000, cor: "text-yellow-500" },
    { nome: "PLATINA", min: 2500, cor: "text-cyan-400" },
    { nome: "DIAMANTE", min: 5000, cor: "text-blue-400" },
    { nome: "MESTRE HUNTER", min: 10000, cor: "text-purple-500" }
  ];

  // O sistema inverte a lista e acha a primeira patente onde os capítulos lidos são maiores que o mínimo exigido
  const patenteAtual = [...patentes].reverse().find(p => totalCapitulos >= p.min) || patentes[0];
  // ----------------------------------

  const conquistas = [
    { id: 1, nome: "PRIMEIRO PASSO", desc: "Adicionou a primeira obra", icone: "🌱", check: totalObras >= 1 },
    { id: 2, nome: "MARATONISTA", desc: "Leu mais de 500 capítulos", icone: "🏃", check: totalCapitulos >= 500 },
    { id: 3, nome: "FINALIZADOR", desc: "Completou 10 séries", icone: "🏆", check: concluidos >= 10 },
    { id: 4, nome: "CURADOR DE ELITE", desc: "Marcar 5 favoritos manuais", icone: "💎", check: favoritos >= 5 },
    { id: 5, nome: "BIBLIOTECÁRIO", desc: "Ter 50 obras na estante", icone: "📚", check: totalObras >= 50 },
    { id: 6, nome: "VICIADO", desc: "Passar dos 2000 capítulos", icone: "⚡", check: totalCapitulos >= 2000 },
  ];



  async function atualizarPin() {
    setSalvando(true);
    const { error } = await supabase
      .from("perfis")
      .update({ pin: novoPin })
      .eq("nome_original", perfil.nome_original);

    if (!error) {
      alert("PIN atualizado com sucesso!");
      aoAtualizar();
    }
    setSalvando(false);
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className={`bg-[#0c0c0e] w-full ${abaAtiva === 'conquistas' ? 'max-w-4xl' : 'max-w-xl'} rounded-[3rem] border border-zinc-800 overflow-hidden shadow-2xl transition-all duration-500`}>
        
        {/* BOTÃO FECHAR */}
        <button onClick={aoFechar} className="absolute top-8 right-8 z-50 text-zinc-500 hover:text-white transition-colors">✕</button>

        {/* HEADER UNIFICADO */}
        <div className="p-10 bg-gradient-to-b from-zinc-900/50 to-transparent text-center border-b border-zinc-800/20">
          <div className="w-20 h-20 bg-zinc-900 rounded-[2rem] flex items-center justify-center text-5xl mx-auto mb-4 border border-zinc-800 shadow-xl">
            {perfil.avatar}
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-white">{perfil.nome_exibicao}</h2>
          
        {/* EXIBIÇÃO DA PATENTE (RANKED) */}
          <div className="mt-2 flex flex-col items-center gap-1">
            <p className={`text-[12px] font-black uppercase tracking-[0.4em] ${patenteAtual.cor} drop-shadow-[0_0_8px_currentColor] transition-all duration-700`}>
              RANK: {patenteAtual.nome}
            </p>
            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
              Poder de Leitura: {totalCapitulos} Capítulos
            </p>
          </div>
          
          {/* SELECTOR DE ABAS */}
          <div className="flex justify-center gap-8 mt-6">
            <button 
              onClick={() => setAbaAtiva('perfil')}
              className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all ${abaAtiva === 'perfil' ? aura.text : 'text-zinc-600'}`}
            >
              Hunter Status
            </button>
            <button 
              onClick={() => setAbaAtiva('conquistas')}
              className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all ${abaAtiva === 'conquistas' ? aura.text : 'text-zinc-600'}`}
            >
              Achievements
            </button>
          </div>
        </div>

        {/* CONTEÚDO DINÂMICO */}
        <div className="p-10">
          {abaAtiva === 'perfil' ? (
            <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
              {/* MINI STATS */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800/50 text-center">
                  <p className="text-lg font-black text-white">{totalObras}</p>
                  <p className="text-[7px] font-bold text-zinc-500 uppercase italic">Obras</p>
                </div>
                <div className="bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800/50 text-center">
                  <p className="text-lg font-black text-white">{totalCapitulos}</p>
                  <p className="text-[7px] font-bold text-zinc-500 uppercase italic">Capítulos</p>
                </div>
                <div className="bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800/50 text-center">
                  <p className="text-lg font-black text-white">{concluidos}</p>
                  <p className="text-[7px] font-bold text-zinc-500 uppercase italic">Finais</p>
                </div>
              </div>

              {/* SEGURANÇA */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase ml-2 tracking-widest">PIN de Acesso</label>
                <div className="flex gap-3">
                  <input 
                    type="password" maxLength={4} placeholder="PIN"
                    className="flex-1 bg-black border border-zinc-800 p-4 rounded-2xl text-center font-bold text-white outline-none focus:border-blue-500 transition-all"
                    value={novoPin} onChange={e => setNovoPin(e.target.value.replace(/\D/g, ''))}
                  />
                  <button onClick={atualizarPin} disabled={salvando} className={`px-8 ${aura.bg} text-black rounded-2xl font-black uppercase text-[10px] hover:brightness-110 transition-all`}>
                    {salvando ? "..." : "Salvar"}
                  </button>
                </div>
              </div>

              <button onClick={() => { setUsuarioAtual(null); aoFechar(); }} className="w-full py-4 bg-zinc-900/50 text-zinc-500 rounded-2xl font-black uppercase text-[10px] border border-zinc-800 hover:text-red-500 transition-all">Sair do Perfil</button>
            </div>
          ) : (
            <div className="animate-in zoom-in-95 duration-500">
               <ColecaoTrofeus trofeusAtivos={conquistas} aura={aura} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}