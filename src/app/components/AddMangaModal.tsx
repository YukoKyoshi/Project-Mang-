"use client";
import { useState, useEffect } from "react";
import { supabase } from "../supabase";

interface AddMangaModalProps {
  estaAberto: boolean;
  fechar: () => void;
  usuarioAtual: string;
  abaPrincipal: "MANGA" | "ANIME";
  aoSalvar: (novoManga: any) => void;
}

export default function AddMangaModal({ estaAberto, fechar, usuarioAtual, abaPrincipal, aoSalvar }: AddMangaModalProps) {
  const [termoAnilist, setTermoAnilist] = useState("");
  const [resultadosAnilist, setResultadosAnilist] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [traduzindo, setTraduzindo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [novoManga, setNovoManga] = useState({ 
    titulo: "", capa: "", capitulo_atual: 0, total_capitulos: 0, status: "Planejo Ler", sinopse: "" 
  });

  useEffect(() => {
    if (!estaAberto) {
      setTermoAnilist("");
      setResultadosAnilist([]);
      setNovoManga({ titulo: "", capa: "", capitulo_atual: 0, total_capitulos: 0, status: "Planejo Ler", sinopse: "" });
    }
  }, [estaAberto]);

  // --- MOTOR DE BUSCA S+ (IA + ANILIST + MAL) ---
  useEffect(() => {
    if (termoAnilist.length < 3) { setResultadosAnilist([]); return; }
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        let termoInteligente = termoAnilist;
        const resIA = await fetch('/api/tradutor-ia', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ termo: termoAnilist })
        });
        if (resIA.ok) {
          const jsonIA = await resIA.json();
          if (jsonIA.resultado && !jsonIA.resultado.includes('⚠️')) termoInteligente = jsonIA.resultado;
        }

        const res = await fetch("https://graphql.anilist.co", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            query: `query ($search: String, $type: MediaType) { Page(perPage: 5) { media(search: $search, type: $type) { id title { romaji english } coverImage { large } chapters episodes description } } }`,
            variables: { search: termoInteligente, type: abaPrincipal }
          })
        });
        const json = await res.json();
        setResultadosAnilist(json.data?.Page?.media || []);
      } catch (err) { console.error(err); } finally { setBuscando(false); }
    }, 1200); 
    return () => clearTimeout(t);
  }, [termoAnilist, abaPrincipal]);

  // ✅ TRADUTOR DE SINOPSE RESTAURADO
  async function traduzirSinopse() {
    if (!novoManga.sinopse) return;
    setTraduzindo(true);
    try {
      const textoLimpo = novoManga.sinopse.replace(/<[^>]*>?/gm, '');
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt-BR&dt=t&q=${encodeURIComponent(textoLimpo)}`);
      const json = await res.json();
      const textoTraduzido = json[0].map((item: any) => item[0]).join('');
      setNovoManga(prev => ({ ...prev, sinopse: textoTraduzido }));
    } catch { alert("Erro na tradução."); } finally { setTraduzindo(false); }
  }

  async function salvarObraFinal() {
    if (!usuarioAtual) return;
    setSalvando(true);
    const tabelaDb = abaPrincipal === "MANGA" ? "mangas" : "animes";
    const { error } = await supabase.from(tabelaDb).insert([{ ...novoManga, usuario: usuarioAtual, ultima_leitura: new Date().toISOString() }]);
    if (!error) {
       // Sincronização com AniList (Opcional se token existir)
       aoSalvar(novoManga);
       fechar();
    }
    setSalvando(false);
  }

  if (!estaAberto) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111114] w-full max-w-2xl p-8 rounded-[2rem] border border-zinc-700 shadow-2xl relative">
        <button onClick={fechar} className="absolute top-6 right-6 text-zinc-500 hover:text-white p-2">✕</button>
        
        {!novoManga.titulo ? (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-green-500 uppercase tracking-tighter">Buscar {abaPrincipal === "MANGA" ? "Mangá" : "Anime"}</h3>
            <input 
              autoFocus type="text" className="w-full bg-zinc-950 p-5 rounded-2xl border border-zinc-800 focus:border-green-500 outline-none text-white" 
              placeholder="Digite o nome..." value={termoAnilist} onChange={(e) => setTermoAnilist(e.target.value)} 
            />
            <div className="mt-4 max-h-64 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {resultadosAnilist.map(m => (
                <div key={m.id} onClick={() => setNovoManga({ 
                  titulo: m.title.romaji || m.title.english, capa: m.coverImage.large, 
                  capitulo_atual: 0, total_capitulos: abaPrincipal === "MANGA" ? (m.chapters || 0) : (m.episodes || 0), 
                  status: "Planejo Ler", sinopse: m.description || "" 
                })} className="p-4 bg-zinc-900/50 rounded-2xl hover:bg-zinc-800 cursor-pointer flex gap-4 items-center border border-zinc-800 transition-all">
                  <img src={m.coverImage.large} className="w-12 h-16 object-cover rounded-xl" alt="" />
                  <p className="font-bold text-sm">{m.title.romaji || m.title.english}</p>
                </div>
              ))}
              {buscando && <div className="text-center p-4 text-green-500 animate-pulse font-bold text-xs uppercase">Buscando...</div>}
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
            <div className="flex gap-6 p-6 bg-zinc-900/50 rounded-3xl border border-zinc-800">
              <img src={novoManga.capa} className="w-28 h-40 object-cover rounded-2xl shadow-2xl" alt="" />
              <div className="flex-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Obra Selecionada</p>
                <h2 className="text-2xl font-bold text-white mb-4 leading-tight">{novoManga.titulo}</h2>
                <button onClick={traduzirSinopse} className="text-[10px] px-4 py-2 rounded-full font-bold border bg-blue-600/10 text-blue-400 border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all uppercase">
                   {traduzindo ? "🔄 Traduzindo..." : "✨ Traduzir Sinopse"}
                </button>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setNovoManga({titulo:"", capa:"", capitulo_atual:0, total_capitulos:0, status:"Planejo Ler", sinopse:""})} className="flex-1 py-5 bg-zinc-800 text-zinc-400 rounded-2xl font-bold uppercase text-xs tracking-widest">Voltar</button>
              <button onClick={salvarObraFinal} disabled={salvando} className="flex-[2] py-5 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-500 transition-all uppercase text-xs tracking-widest">Salvar na Estante</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}