"use client";
import { useState, useEffect } from "react";

interface MangaDetailsModalProps {
  manga: any;
  aoFechar: () => void;
  aoAtualizarCapitulo: (manga: any, novo: number) => void;
  aoAtualizarDados: (id: number, campos: any) => void;
  aoDeletar: (id: number) => void;
}

export default function MangaDetailsModal({ manga, aoFechar, aoAtualizarCapitulo, aoAtualizarDados, aoDeletar }: MangaDetailsModalProps) {
  const [mostrarInputCapa, setMostrarInputCapa] = useState(false);

  // [CORREÇÃO] - Memória Local (Impede o campo de travar enquanto você digita)
  const [capLocal, setCapLocal] = useState("");
  const [notaLocal, setNotaLocal] = useState("");
  const [notaAmigosLocal, setNotaAmigosLocal] = useState("");
  const [sinopseLocal, setSinopseLocal] = useState("");
  const [comentariosLocal, setComentariosLocal] = useState("");

  // Sincroniza a memória local quando o modal abre
  useEffect(() => {
    if (manga) {
      setCapLocal(manga.capitulo_atual?.toString() || "0");
      setNotaLocal(manga.nota_pessoal?.toString() || "0");
      setNotaAmigosLocal(manga.nota_amigos?.toString() || "0");
      setSinopseLocal(manga.sinopse || "");
      setComentariosLocal(manga.comentarios || "");
    }
  }, [manga]);

  if (!manga) return null;

  // Funções que só disparam o salvamento quando você termina de digitar (onBlur)
  const salvarCapitulo = () => aoAtualizarCapitulo(manga, parseInt(capLocal) || 0);
  const salvarNota = () => aoAtualizarDados(manga.id, { nota_pessoal: parseFloat(notaLocal) || 0 });
  const salvarNotaAmigos = () => aoAtualizarDados(manga.id, { nota_amigos: parseFloat(notaAmigosLocal) || 0 });
  const salvarTextos = () => aoAtualizarDados(manga.id, { sinopse: sinopseLocal, comentarios: comentariosLocal });

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={aoFechar}></div>
      <div className="relative w-full max-w-5xl bg-[#0e0e11] border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in duration-300">
        
        {/* Lado da Capa */}
        <div className="relative w-full md:w-96 group overflow-hidden">
          <img src={manga.capa} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          
          <button 
            onClick={() => setMostrarInputCapa(!mostrarInputCapa)}
            className="absolute top-4 right-4 p-3 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all hover:bg-green-600 hover:scale-110 z-20"
            title="Editar Capa"
          >
            🖼️
          </button>

          {mostrarInputCapa && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-300 z-10">
              <p className="text-[10px] font-bold text-green-500 uppercase tracking-[0.2em] mb-4 text-center">Insira a URL da Nova Imagem</p>
              <input 
                autoFocus
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-green-500 shadow-2xl"
                placeholder="https://link.com/foto.jpg"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    aoAtualizarDados(manga.id, { capa: (e.target as HTMLInputElement).value });
                    setMostrarInputCapa(false);
                  }
                }}
              />
              <button onClick={() => setMostrarInputCapa(false)} className="mt-4 text-[10px] text-zinc-500 hover:text-white uppercase font-bold">Cancelar</button>
            </div>
          )}
        </div>

        {/* Informações e Edição */}
        <div className="p-8 md:p-12 flex-1 overflow-y-auto max-h-[70vh] md:max-h-[85vh] custom-scrollbar">
          <div className="flex justify-between items-start mb-8">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">{manga.titulo}</h2>
                <button 
                  onClick={() => aoAtualizarDados(manga.id, { favorito: !manga.favorito })}
                  className={`text-3xl transition-all active:scale-150 duration-300 ${manga.favorito ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.4)]' : 'text-zinc-700 hover:text-zinc-500'}`}
                >
                  {manga.favorito ? '★' : '☆'}
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Progresso:</span>
                <div className="flex items-center bg-zinc-900 rounded-lg px-2 border border-zinc-800 focus-within:border-green-500 transition-colors">
                    {/* [CORREÇÃO] - Input de Progresso Livre */}
                    <input 
                        type="number" 
                        className="bg-transparent text-green-500 font-bold outline-none w-14 text-center text-sm" 
                        value={capLocal} 
                        onChange={(e) => setCapLocal(e.target.value)} 
                        onBlur={salvarCapitulo}
                        onKeyDown={(e) => e.key === 'Enter' && salvarCapitulo()}
                    />
                    <span className="text-zinc-600 text-xs">/ {manga.total_capitulos || '?'}</span>
                </div>
              </div>
            </div>
            <button onClick={aoFechar} className="text-zinc-500 text-xl hover:text-white transition-colors">✕</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="p-5 bg-zinc-900/50 rounded-2xl border border-zinc-800">
              <p className="text-[10px] font-bold text-zinc-500 uppercase mb-3 tracking-widest">Status</p>
              <select className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs font-bold text-white outline-none focus:border-green-500" value={manga.status} onChange={(e) => aoAtualizarDados(manga.id, {status: e.target.value})}>
                <option value="Lendo">📖 Lendo</option>
                <option value="Planejo Ler">⏳ Planejo Ler</option>
                <option value="Completos">✅ Completos</option>
                <option value="Dropados">❌ Dropados</option>
              </select>
            </div>
            {/* [CORREÇÃO] - Input de Nota Livre */}
            <div className="p-5 bg-zinc-900/50 rounded-2xl border border-zinc-800 focus-within:border-yellow-500 transition-colors">
              <p className="text-[10px] font-bold text-zinc-500 uppercase mb-2 tracking-widest">Sua Nota</p>
              <input type="number" step="0.1" className="bg-transparent text-3xl font-black text-yellow-500 outline-none w-full" value={notaLocal} onChange={(e) => setNotaLocal(e.target.value)} onBlur={salvarNota} onKeyDown={(e) => e.key === 'Enter' && salvarNota()} />
            </div>
            {/* [CORREÇÃO] - Input de Nota Amigos Livre */}
            <div className="p-5 bg-zinc-900/50 rounded-2xl border border-zinc-800 focus-within:border-blue-500 transition-colors">
              <p className="text-[10px] font-bold text-zinc-500 uppercase mb-2 tracking-widest">Nota Amigos</p>
              <input type="number" step="0.1" className="bg-transparent text-3xl font-black text-blue-400 outline-none w-full" value={notaAmigosLocal} onChange={(e) => setNotaAmigosLocal(e.target.value)} onBlur={salvarNotaAmigos} onKeyDown={(e) => e.key === 'Enter' && salvarNotaAmigos()} />
            </div>
          </div>

          <div className="mb-10">
            <h3 className="text-[10px] font-bold text-green-500 uppercase mb-3 tracking-[0.2em]">Sinopse (Editável)</h3>
            <textarea className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-sm text-zinc-400 h-44 outline-none focus:border-green-500 transition-all resize-none leading-relaxed" value={sinopseLocal} onChange={(e) => setSinopseLocal(e.target.value)} onBlur={salvarTextos} />
          </div>

          <div className="mb-10">
            <h3 className="text-[10px] font-bold text-blue-500 uppercase mb-3 tracking-[0.2em]">Resenha / Comentários</h3>
            <textarea className="w-full bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 text-sm text-zinc-300 h-44 outline-none focus:border-blue-500 transition-all resize-none shadow-inner" placeholder="O que você achou?" value={comentariosLocal} onChange={(e) => setComentariosLocal(e.target.value)} onBlur={salvarTextos} />
          </div>
          
          <button onClick={() => aoDeletar(manga.id)} className="w-full py-5 bg-red-600/5 text-red-500 font-bold uppercase text-[10px] tracking-[0.3em] rounded-2xl border border-red-600/10 hover:bg-red-600 hover:text-white transition-all">Excluir Obra</button>
        </div>
      </div>
    </div>
  );
}