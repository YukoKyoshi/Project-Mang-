"use client";
import React, { useState } from 'react';
import { supabase } from '../supabase';

interface UserProfileProps {
  perfil: any;
  mangas: any[];
  aoFechar: () => void;
  aoAtualizar: () => void;
  setUsuarioAtual: (v: string | null) => void;
}

export default function UserProfile({ perfil, mangas, aoFechar, aoAtualizar, setUsuarioAtual }: UserProfileProps) {
  const [novoPin, setNovoPin] = useState(perfil.pin || "");
  const [salvando, setSalvando] = useState(false);

  const totalMangas = mangas.length;
  const lendo = mangas.filter(m => m.status === "Lendo").length;
  const concluidos = mangas.filter(m => m.status === "Completos").length;

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
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-[#0c0c0e] w-full max-w-xl rounded-[3rem] border border-zinc-800 overflow-hidden shadow-2xl">
        
        <div className="p-10 bg-gradient-to-b from-zinc-900/50 to-transparent text-center relative">
          <button onClick={aoFechar} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors">✕</button>
          <div className="w-24 h-24 bg-zinc-900 rounded-[2rem] flex items-center justify-center text-5xl mx-auto mb-6 border border-zinc-700 shadow-xl">
            {perfil.avatar}
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white">{perfil.nome_exibicao}</h2>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-2">Nível Hunter S</p>
        </div>

        <div className="p-10 space-y-10">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 text-center">
              <p className="text-2xl mb-1">📚</p>
              <p className="text-xl font-black text-white">{totalMangas}</p>
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Obras</p>
            </div>
            <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 text-center">
              <p className="text-2xl mb-1">🔥</p>
              <p className="text-xl font-black text-white">{lendo}</p>
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Lendo</p>
            </div>
            <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 text-center">
              <p className="text-2xl mb-1">🏆</p>
              <p className="text-xl font-black text-white">{concluidos}</p>
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Finais</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-zinc-500 uppercase ml-2 tracking-widest">Alterar PIN de Acesso</label>
            <div className="flex gap-3">
              <input 
                type="password" maxLength={4} placeholder="NOVO PIN"
                className="flex-1 bg-black border border-zinc-800 p-4 rounded-2xl text-center font-bold text-white outline-none focus:border-blue-500 transition-all"
                value={novoPin} onChange={e => setNovoPin(e.target.value.replace(/\D/g, ''))}
              />
              <button 
                onClick={atualizarPin}
                disabled={salvando}
                className="px-8 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] hover:bg-blue-500 transition-all disabled:opacity-50"
              >
                {salvando ? "..." : "Salvar"}
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-800 flex gap-4">
            <button 
              onClick={() => { setUsuarioAtual(null); aoFechar(); }}
              className="flex-1 py-4 bg-zinc-900 text-zinc-500 rounded-2xl font-black uppercase text-[10px] border border-zinc-800 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 transition-all"
            >
              Trocar de Perfil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}