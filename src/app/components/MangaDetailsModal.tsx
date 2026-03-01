"use client";

interface Manga { 
  id: number; titulo: string; capa: string; capitulo_atual: number; total_capitulos: number; 
  status: string; sinopse: string; nota_pessoal: number; nota_amigos: number; 
  comentarios: string; usuario: string; ultima_leitura: string; favorito: boolean; 
}

interface MangaDetailsModalProps {
  manga: Manga;
  abaPrincipal: "MANGA" | "ANIME";
  aoFechar: () => void;
  aoAtualizarCapitulo: (manga: Manga, novo: number) => void;
  aoAtualizarDados: (id: number, campos: any) => void;
  aoDeletar: (id: number) => void;
}

export default function MangaDetailsModal({ manga, abaPrincipal, aoFechar, aoAtualizarCapitulo, aoAtualizarDados, aoDeletar }: MangaDetailsModalProps) {
  
  const termoProgresso = abaPrincipal === "MANGA" ? "Capítulo" : "Episódio";

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#0e0e11] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] border border-zinc-800 shadow-2xl custom-scrollbar">
        
        <div className="relative h-64 md:h-80 w-full overflow-hidden">
          <img src={manga.capa} className="w-full h-full object-cover blur-3xl opacity-20 scale-110" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e11] to-transparent" />
          
          <div className="absolute inset-0 p-8 flex flex-col md:flex-row gap-8 items-end">
            <img src={manga.capa} className="w-32 md:w-44 aspect-[2/3] object-cover rounded-2xl shadow-2xl border-4 border-zinc-900" alt="" />
            <div className="flex-1 mb-4">
              <span className="bg-zinc-800 text-zinc-400 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest mb-3 inline-block">
                {abaPrincipal} • {
                  manga.status === "Lendo" && abaPrincipal === "ANIME" ? "Assistindo" : 
                  manga.status === "Planejo Ler" && abaPrincipal === "ANIME" ? "Planejo Assistir" : 
                  manga.status
                }
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter leading-none">{manga.titulo}</h2>
            </div>
            <button onClick={aoFechar} className="absolute top-8 right-8 text-zinc-600 hover:text-white transition-colors text-2xl font-black">✕</button>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-12">
          
          <div className="space-y-8">
            <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Progresso Atual</p>
              <div className="flex items-center justify-between">
                <button onClick={() => aoAtualizarCapitulo(manga, manga.capitulo_atual - 1)} className="w-12 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-all font-black text-xl">-</button>
                <div className="text-center">
                  <span className="text-4xl font-black text-white">{manga.capitulo_atual}</span>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase">{termoProgresso}s</p>
                </div>
                <button onClick={() => aoAtualizarCapitulo(manga, manga.capitulo_atual + 1)} className="w-12 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-all font-black text-xl">+</button>
              </div>
              <p className="text-center text-[10px] text-zinc-700 mt-4 font-bold uppercase tracking-widest">Total: {manga.total_capitulos || '?'}</p>
            </div>

            <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Mudar Status</p>
              <select 
                value={manga.status} 
                onChange={(e) => aoAtualizarDados(manga.id, { status: e.target.value })}
                className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-xs font-black uppercase outline-none focus:border-white transition-all cursor-pointer"
              >
                <option value="Lendo">{abaPrincipal === "MANGA" ? "Lendo" : "Assistindo"}</option>
                <option value="Completos">Completos</option>
                <option value="Planejo Ler">{abaPrincipal === "MANGA" ? "Planejo Ler" : "Planejo Assistir"}</option>
                <option value="Pausados">Pausados</option>
                <option value="Dropados">Dropados</option>
              </select>
            </div>
          </div>

          <div className="md:col-span-2 space-y-8">
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Sinopse da Obra</p>
              <p className="text-zinc-400 text-sm leading-relaxed max-h-40 overflow-y-auto pr-4 custom-scrollbar">
                {manga.sinopse || "Sem descrição disponível."}
              </p>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button 
                onClick={() => aoDeletar(manga.id)}
                className="px-6 py-3 rounded-xl border border-red-500/20 text-red-500 text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all"
              >
                Remover {abaPrincipal === "MANGA" ? "Mangá" : "Anime"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}