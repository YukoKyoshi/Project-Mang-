"use client";

interface MangaCardProps {
  manga: any;
  atualizarCapitulo: (manga: any, novo: number) => void;
  deletarManga: (id: number) => void;
  mudarStatusManual: (id: number, status: string) => void;
  abrirDetalhes: (manga: any) => void;
  aura: any; // [NOVO] - Recebe a cor mágica da página!
}

export default function MangaCard({ manga, atualizarCapitulo, deletarManga, mudarStatusManual, abrirDetalhes, aura }: MangaCardProps) {
  const porcentagem = manga.total_capitulos > 0 ? Math.min((manga.capitulo_atual / manga.total_capitulos) * 100, 100) : 0;

  return (
    <div className={`group relative bg-[#111114] border border-zinc-800 rounded-3xl overflow-hidden hover:${aura.border} hover:${aura.shadow} transition-all duration-500 flex flex-col shadow-xl hover:-translate-y-2`}>
      
      {/* Capa e Status */}
      <div className="relative aspect-[3/4] cursor-pointer overflow-hidden" onClick={() => abrirDetalhes(manga)}>
        <img src={manga.capa} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" alt={manga.titulo} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
        
        {/* Badge de Status */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end z-10">
          <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-300 border border-white/10 shadow-lg">
            {manga.status}
          </span>
          {manga.favorito && (
            <span className="px-2 py-1 bg-yellow-500/20 backdrop-blur-md rounded-full text-[10px] border border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.5)]">
              ⭐
            </span>
          )}
        </div>

        {/* Informações na Imagem */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <h3 className="font-black text-white text-lg leading-tight line-clamp-2 drop-shadow-lg">{manga.titulo}</h3>
          {(manga.nota_pessoal > 0 || manga.nota_amigos > 0) && (
            <div className="flex gap-2 mt-2">
              {manga.nota_pessoal > 0 && <span className="text-[10px] font-bold bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-md border border-yellow-500/30">Você: {manga.nota_pessoal}</span>}
              {manga.nota_amigos > 0 && <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-md border border-blue-500/30">Amigos: {manga.nota_amigos}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Controles e Progresso */}
      <div className="p-4 bg-[#0e0e11] flex flex-col justify-between flex-1 relative z-20">
        
        {/* Barra de Progresso com a Aura */}
        <div className="mb-4">
          <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
            <span>Progresso</span>
            <span className={aura.text}>{porcentagem.toFixed(0)}%</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
            <div className={`h-full ${aura.bg} transition-all duration-500 shadow-[0_0_10px_var(--aura)]`} style={{ width: `${porcentagem}%` }}></div>
          </div>
        </div>

        {/* Botões de Capítulo */}
        <div className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 rounded-2xl p-1 shadow-inner">
          <button onClick={() => atualizarCapitulo(manga, manga.capitulo_atual - 1)} className="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-500 hover:text-white hover:bg-red-500/20 hover:border-red-500 transition-all font-black border border-transparent">-</button>
          <div className="flex flex-col items-center">
            <span className={`text-xl font-black ${aura.text} leading-none`}>{manga.capitulo_atual}</span>
            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">/ {manga.total_capitulos || '?'}</span>
          </div>
          <button onClick={() => atualizarCapitulo(manga, manga.capitulo_atual + 1)} className={`w-10 h-10 flex items-center justify-center rounded-xl text-zinc-500 hover:text-white hover:${aura.bgActive} transition-all font-black border border-transparent`}>+</button>
        </div>
      </div>
    </div>
  );
}