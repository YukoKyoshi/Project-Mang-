"use client";

import React from 'react';

// Definindo o que o AdminPanel precisa receber para funcionar
interface AdminPanelProps {
  perfis: any[];
  config: any;
  mostrandoFormHunter: boolean;
  setMostrandoFormHunter: (v: boolean) => void;
  novoHunter: any;
  setNovoHunter: (v: any) => void;
  salvarNovoHunter: () => void;
  deletarPerfil: (p: any) => void;
  setUsuarioAtual: (v: string | null) => void;
}

export default function AdminPanel({
  perfis, config, mostrandoFormHunter, setMostrandoFormHunter,
  novoHunter, setNovoHunter, salvarNovoHunter, deletarPerfil, setUsuarioAtual
}: AdminPanelProps) {
  return (
    <main className="min-h-screen bg-[#050505] text-white p-6 md:p-12 animate-in fade-in duration-500">
      <header className="flex justify-between items-center mb-12 border-b border-yellow-500/20 pb-8">
        <div>
          <h1 className="text-4xl font-black uppercase italic text-yellow-500 tracking-tighter">Painel de Controle</h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.4em]">Configurações Nível S</p>
        </div>
        <button 
          onClick={() => setUsuarioAtual(null)} 
          className="px-8 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs font-black uppercase hover:bg-white hover:text-black transition-all shadow-xl"
        >
          Fechar Painel
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* COLUNA 1: GESTÃO DE EQUIPE */}
        <section className="bg-zinc-900/40 p-8 rounded-[3rem] border border-zinc-800 shadow-2xl">
          <h3 className="text-lg font-black uppercase mb-8 flex items-center gap-3">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Gestão de Equipe
          </h3>
          
          {/* BOTÃO/FORMULÁRIO DE RECRUTAMENTO */}
          {!mostrandoFormHunter ? (
            <button 
              onClick={() => setMostrandoFormHunter(true)}
              className="w-full mb-8 group bg-gradient-to-br from-zinc-800 to-zinc-900 p-1 rounded-[2rem] transition-all hover:scale-[1.01]"
            >
              <div className="bg-[#080808] rounded-[1.9rem] py-8 flex flex-col items-center gap-3 border border-zinc-800 group-hover:border-yellow-500/50 transition-colors">
                <span className="text-4xl">➕</span>
                <span className="font-black uppercase text-xs tracking-[0.3em] text-zinc-400 group-hover:text-white">Recrutar Novo Hunter</span>
              </div>
            </button>
          ) : (
            <div className="mb-8 p-8 bg-black/60 rounded-[2.5rem] border border-yellow-500/20 animate-in zoom-in-95 duration-300">
              <div className="grid grid-cols-1 gap-6">
                <input 
                  type="text" placeholder="NOME DO HUNTER" 
                  className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl font-bold uppercase text-xs focus:border-yellow-500 outline-none text-white"
                  value={novoHunter.nome} onChange={e => setNovoHunter({...novoHunter, nome: e.target.value})}
                />
                <div className="flex gap-4">
                  <input 
                    type="text" placeholder="AVATAR" 
                    className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl font-bold text-center w-24 outline-none text-white text-2xl"
                    value={novoHunter.avatar} onChange={e => setNovoHunter({...novoHunter, avatar: e.target.value})}
                  />
                  <input 
                    type="password" placeholder="PIN" maxLength={4}
                    className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl font-bold uppercase text-xs flex-1 outline-none text-white"
                    value={novoHunter.pin} onChange={e => setNovoHunter({...novoHunter, pin: e.target.value.replace(/\D/g, '')})}
                  />
                </div>
                <select 
                  className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl font-bold uppercase text-xs outline-none cursor-pointer text-white"
                  value={novoHunter.cor} onChange={e => setNovoHunter({...novoHunter, cor: e.target.value})}
                >
                  <option value="verde">AURA VERDE</option>
                  <option value="azul">AURA AZUL</option>
                  <option value="roxo">AURA ROXA</option>
                  <option value="laranja">AURA LARANJA</option>
                </select>
                <div className="flex gap-3 pt-2">
                  <button onClick={salvarNovoHunter} className="flex-1 py-4 bg-yellow-500 text-black font-black uppercase text-xs rounded-xl hover:brightness-110">Confirmar</button>
                  <button onClick={() => setMostrandoFormHunter(false)} className="px-6 py-4 bg-zinc-800 text-zinc-400 font-black uppercase text-xs rounded-xl">Cancelar</button>
                </div>
              </div>
            </div>
          )}

          {/* LISTA DE HUNTERS */}
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
            {perfis.map(p => (
              <div key={p.nome_original} className="grid grid-cols-[1fr_auto] items-center gap-4 p-5 bg-black/40 rounded-3xl border border-zinc-800 group hover:border-zinc-700 transition-all shadow-lg">
                <div className="flex items-center gap-5 min-w-0">
                  <div className="w-14 h-14 min-w-[3.5rem] bg-zinc-900 rounded-2xl flex items-center justify-center text-3xl border border-zinc-800">{p.avatar}</div>
                  <div className="min-w-0">
                    <p className="font-black uppercase text-sm tracking-wider truncate text-white">{p.nome_exibicao}</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">PIN: <span className="text-zinc-300">{p.pin || "Aberto"}</span></p>
                  </div>
                </div>
                <button 
                  onClick={() => deletarPerfil(p)}
                  className="w-12 h-12 flex items-center justify-center bg-zinc-900 rounded-xl border border-zinc-800 text-zinc-600 hover:text-red-500 transition-all"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* COLUNA 2: INTERFACE GLOBAL */}
        <section className="bg-zinc-900/40 p-8 rounded-[3rem] border border-zinc-800 shadow-2xl">
          <h3 className="text-lg font-black uppercase mb-8 flex items-center gap-3 text-yellow-500">
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
            Interface Global
          </h3>
          <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest text-center mt-20 italic">
            Aqui colocaremos os interruptores de visibilidade em breve.
          </p>
        </section>

      </div>
    </main>
  );
}