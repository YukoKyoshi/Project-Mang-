"use client";

export default function MangaDetailsModal({ manga, aoFechar, aoAtualizarCapitulo, aoAtualizarDados, aoDeletar, aura }: any) {
  if (!manga) return null;

  const handleTranslate = async () => {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(manga.sinopse)}`);
    const data = await res.json();
    aoAtualizarDados(manga.id, { sinopse: data[0][0][0] });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in">
      <div className={`bg-[#0e0e11] border border-zinc-800 w-full max-w-4xl rounded-[4rem] overflow-hidden flex flex-col md:flex-row shadow-2xl relative ${aura.shadow}`}>
        <button onClick={aoFechar} className="absolute top-6 right-8 z-50 text-zinc-500 hover:text-white text-3xl transition-colors">✕</button>
        
        <div className="w-full md:w-1/3 aspect-[3/4.5] relative">
          <img src={manga.capa} className="w-full h-full object-cover" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e11] via-transparent to-transparent"></div>
        </div>

        <div className="p-10 md:p-14 flex-1 flex flex-col justify-between overflow-y-auto max-h-[80vh]">
          <div>
            <div className="flex items-center gap-4 mb-4">
               <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${aura.border} ${aura.text}`}>{manga.status}</span>
               {manga.favorito && <span className="text-yellow-500 text-xl">★</span>}
            </div>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-6 leading-none">{manga.titulo}</h2>
            
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Sinopse</p>
                 <button onClick={handleTranslate} className={`text-[9px] font-black uppercase tracking-widest hover:${aura.text} transition-colors opacity-50 hover:opacity-100 italic`}>[ Traduzir para PT-BR ]</button>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed font-medium line-clamp-6 md:line-clamp-none overflow-y-auto pr-2 max-h-48 custom-scrollbar">
                {manga.sinopse?.replace(/<[^>]*>?/gm, '') || "Sem descrição disponível."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-zinc-800">
             <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-900">
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2 text-center">Sua Nota</p>
                <div className="flex justify-center gap-1">
                   {[1,2,3,4,5].map(n => (
                     <button key={n} onClick={() => aoAtualizarDados(manga.id, { nota_pessoal: n })} className={`text-2xl transition-all ${manga.nota_pessoal >= n ? 'grayscale-0 scale-110' : 'grayscale opacity-20 hover:opacity-50'}`}>⭐</button>
                   ))}
                </div>
             </div>
             <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-900 flex flex-col items-center justify-center gap-2">
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Favorito</p>
                <button 
                  onClick={() => aoAtualizarDados(manga.id, { favorito: !manga.favorito })}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all border ${manga.favorito ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}
                >
                  {manga.favorito ? "★" : "☆"}
                </button>
             </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button onClick={() => aoDeletar(manga.id)} className="flex-1 py-4 bg-red-950/20 text-red-500 border border-red-900/30 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Remover da Estante</button>
          </div>
        </div>
      </div>
    </div>
  );
}