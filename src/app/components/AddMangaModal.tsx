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

interface ResultadoBusca {
  id: number | string;
  titulo: string;
  capa: string;
  total: number;
  sinopse: string;
  fonte: "AniList" | "MyAnimeList";
}

export default function AddMangaModal({ estaAberto, fechar, usuarioAtual, abaPrincipal, aoSalvar }: AddMangaModalProps) {
  const [termoAnilist, setTermoAnilist] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusca[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [traduzindo, setTraduzindo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  
  const [novoManga, setNovoManga] = useState({ 
    titulo: "", capa: "", capitulo_atual: 0, total_capitulos: 0, status: "Planejo Ler", sinopse: "" 
  });

  useEffect(() => {
    if (!estaAberto) {
      setTermoAnilist("");
      setResultados([]);
      setNovoManga({ titulo: "", capa: "", capitulo_atual: 0, total_capitulos: 0, status: "Planejo Ler", sinopse: "" });
    }
  }, [estaAberto]);

  // --- HIERARQUIA DE BUSCA APROVADA ---
  useEffect(() => {
    if (termoAnilist.length < 3) { setResultados([]); return; }
    
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        let termoFinal = termoAnilist;

        // 1. CACHE
        const { data: cacheHit } = await supabase.from('search_cache').select('resultado_ia').ilike('termo_original', termoAnilist).maybeSingle();

        if (cacheHit) {
          termoFinal = cacheHit.resultado_ia;
        } else {
          // 2. I.A. (Prompt Poucos Exemplos)
          const resIA = await fetch('/api/tradutor-ia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ termo: termoAnilist })
          });
          if (resIA.ok) {
            const jsonIA = await resIA.json();
            if (jsonIA.resultado) {
              termoFinal = jsonIA.resultado;
              await supabase.from('search_cache').insert([{ termo_original: termoAnilist, resultado_ia: termoFinal }]);
            }
          }
        }

        // 3. ANILIST
        const resAni = await fetch("https://graphql.anilist.co", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            query: `query ($search: String, $type: MediaType) { Page(perPage: 5) { media(search: $search, type: $type) { id title { romaji english } coverImage { large } chapters episodes description } } }`,
            variables: { search: termoFinal, type: abaPrincipal }
          })
        });
        const jsonAni = await resAni.json();
        const listaAni = jsonAni.data?.Page?.media || [];

        if (listaAni.length > 0) {
          setResultados(listaAni.map((m: any): ResultadoBusca => ({
            id: m.id, titulo: m.title.romaji || m.title.english, capa: m.coverImage.large,
            total: abaPrincipal === "MANGA" ? (m.chapters || 0) : (m.episodes || 0),
            sinopse: m.description || "", fonte: "AniList"
          })));
        } else {
          // 4. MAL FALLBACK
          const resMal = await fetch(`https://api.jikan.moe/v4/${abaPrincipal === "MANGA" ? "manga" : "anime"}?q=${encodeURIComponent(termoFinal)}&limit=5`);
          const jsonMal = await resMal.json();
          setResultados(jsonMal.data?.map((m: any): ResultadoBusca => ({
            id: m.mal_id, titulo: m.title, capa: m.images.jpg.large_image_url,
            total: abaPrincipal === "MANGA" ? (m.chapters || 0) : (m.episodes || 0),
            sinopse: m.synopsis || "", fonte: "MyAnimeList"
          })) || []);
        }
      } catch (err) { console.error(err); } finally { setBuscando(false); }
    }, 1200); 
    return () => clearTimeout(t);
  }, [termoAnilist, abaPrincipal]);

  async function salvarObraFinal() {
    if (!usuarioAtual) return;
    setSalvando(true);
    // ✅ Corrigindo o erro 401: Verifique se o RLS está desativado no Supabase para 'animes'
    const { error } = await supabase.from(abaPrincipal === "MANGA" ? "mangas" : "animes").insert([{ ...novoManga, usuario: usuarioAtual, ultima_leitura: new Date().toISOString() }]);
    if (!error) { aoSalvar(novoManga); fechar(); } else { alert("Erro ao salvar: Verifique o RLS da tabela."); }
    setSalvando(false);
  }

  if (!estaAberto) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111114] w-full max-w-2xl p-8 rounded-[2rem] border border-zinc-700 shadow-2xl relative">
        <button onClick={fechar} className="absolute top-6 right-6 text-zinc-500 hover:text-white p-2">✕</button>
        {!novoManga.titulo ? (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-green-500 uppercase italic">Hunter Search S+</h3>
            <input autoFocus type="text" className="w-full bg-zinc-950 p-5 rounded-2xl border border-zinc-800 outline-none text-white text-lg font-bold" placeholder="Pesquise em português..." value={termoAnilist} onChange={(e) => setTermoAnilist(e.target.value)} />
            <div className="mt-4 max-h-64 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {resultados.map((m: ResultadoBusca) => (
                <div key={m.id} onClick={() => setNovoManga({ titulo: m.titulo, capa: m.capa, capitulo_atual: 0, total_capitulos: m.total, status: "Planejo Ler", sinopse: m.sinopse })} className="p-4 bg-zinc-900/50 rounded-2xl hover:bg-zinc-800 cursor-pointer flex gap-4 items-center border border-zinc-800 transition-all">
                  <div className="relative"><img src={m.capa} className="w-12 h-16 object-cover rounded-xl" /><span className="absolute -top-2 -left-2 bg-black text-[6px] px-2 py-1 rounded-md border border-zinc-700 text-zinc-500 font-black">{m.fonte}</span></div>
                  <p className="font-bold text-sm">{m.titulo}</p>
                </div>
              ))}
              {buscando && <div className="text-center p-4 text-green-500 animate-pulse font-black text-[10px] uppercase">Processando...</div>}
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
            <div className="flex gap-6 p-6 bg-zinc-900/50 rounded-3xl border border-zinc-800">
              <img src={novoManga.capa} className="w-28 h-40 object-cover rounded-2xl shadow-2xl" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-4 italic">{novoManga.titulo}</h2>
              </div>
            </div>

            {/* ✅ CAMPOS RESTAURADOS */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase mb-3 ml-1 tracking-widest">Aonde parou? ({abaPrincipal === "MANGA" ? "Capítulo" : "Episódio"})</p>
                <input type="number" className="w-full bg-zinc-950 p-5 rounded-2xl border border-zinc-800 outline-none focus:border-green-500 text-2xl font-bold text-green-500" value={novoManga.capitulo_atual} onChange={e => setNovoManga({...novoManga, capitulo_atual: parseInt(e.target.value) || 0})} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase mb-3 ml-1 tracking-widest">Status Inicial</p>
                <select value={novoManga.status} onChange={(e) => setNovoManga({...novoManga, status: e.target.value})} className="w-full bg-zinc-950 p-5 rounded-2xl border border-zinc-800 text-sm font-bold text-white uppercase outline-none"><option value="Lendo">{abaPrincipal === "MANGA" ? "Lendo" : "Assistindo"}</option><option value="Planejo Ler">{abaPrincipal === "MANGA" ? "Planejo Ler" : "Planejo Assistir"}</option><option value="Completos">Completos</option><option value="Pausados">Pausados</option><option value="Dropados">Dropados</option></select>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setNovoManga({titulo:"", capa:"", capitulo_atual:0, total_capitulos:0, status:"Planejo Ler", sinopse:""})} className="flex-1 py-5 bg-zinc-800 text-zinc-400 rounded-2xl font-bold uppercase text-xs">Voltar</button>
              <button onClick={salvarObraFinal} disabled={salvando} className="flex-[2] py-5 bg-green-600 text-white rounded-2xl font-bold uppercase text-xs shadow-lg shadow-green-600/20">{salvando ? "Processando..." : "Salvar na Estante"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}