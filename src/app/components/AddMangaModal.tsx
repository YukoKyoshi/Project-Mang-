"use client";
import { useState } from "react";

export default function AddMangaModal({ estaAberto, fechar, usuarioAtual, aoSalvar, aura }: any) {
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);

  async function pesquisar() {
    if (!busca) return;
    setCarregando(true);
    const query = `query ($search: String) { Page(perPage: 5) { media(search: $search, type: MANGA) { id title { romaji english } coverImage { large } description chapters status genres } } }`;
    const resp = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { search: busca } })
    });
    const { data } = await resp.json();
    setResultados(data.Page.media);
    setCarregando(false);
  }

  if (!estaAberto) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#0e0e11] border border-zinc-800 w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-black uppercase tracking-widest text-white">Adicionar à Estante</h2>
          <button onClick={fechar} className="text-zinc-500 hover:text-white transition-colors text-2xl">✕</button>
        </div>

        <div className="p-8">
          <div className="flex gap-4 mb-8">
            <input 
              autoFocus
              className={`flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 outline-none transition-all ${aura.focus}`}
              placeholder="Digite o nome do mangá..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && pesquisar()}
            />
            <button onClick={pesquisar} className={`px-8 rounded-2xl font-black uppercase tracking-widest transition-all ${aura.bg} text-white shadow-lg`}>
              {carregando ? "..." : "Buscar"}
            </button>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {resultados.map(m => (
              <div key={m.id} className="flex gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-[2rem] hover:border-zinc-600 transition-all group">
                <img src={m.coverImage.large} className="w-20 h-28 object-cover rounded-xl shadow-lg" alt="" />
                <div className="flex-1">
                  <h3 className="font-black text-white leading-tight mb-1 group-hover:text-green-400 transition-colors line-clamp-1">{m.title.romaji}</h3>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-4">{m.chapters || '?'} Capítulos • {m.status}</p>
                  <button 
                    onClick={() => aoSalvar({ titulo: m.title.romaji, capa: m.coverImage.large, total_capitulos: m.chapters || 0, capitulo_atual: 0, status: "Planejo Ler", sinopse: m.description, nota_pessoal: 0, nota_amigos: 0, favorito: false })}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all hover:${aura.bg} hover:text-white`}
                  >
                    + Adicionar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}