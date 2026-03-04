"use client";
import { useState, useEffect } from "react";
import { supabase } from "../supabase";

// ==========================================
// 📦 SESSÃO 1: INTERFACES
// ==========================================
interface ResultadoBusca {
  id: number | string;
  titulo: string;
  capa: string;
  total: number;
  sinopse: string;
  fonte: "AniList" | "MyAnimeList" | "TMDB" | "Google Books";
}

interface AddMangaModalProps {
  estaAberto: boolean;
  fechar: () => void;
  usuarioAtual: string;
  abaPrincipal: "MANGA" | "ANIME" | "FILME" | "LIVRO";
  aoSalvar: (novoManga: any) => void;
}

export default function AddMangaModal({ estaAberto, fechar, usuarioAtual, abaPrincipal, aoSalvar }: AddMangaModalProps) {
  // ==========================================
  // 🔐 SESSÃO 2: ESTADOS DO MODAL
  // ==========================================
  const [termoAnilist, setTermoAnilist] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusca[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [traduzindo, setTraduzindo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  
  // ✅ CONSISTÊNCIA: Adicionado 'favorito' para evitar nulos no banco e quebra de missões
  const [novoManga, setNovoManga] = useState({ 
    titulo: "", capa: "", capitulo_atual: 0, total_capitulos: 0, status: "Planejo Ler", sinopse: "", favorito: false 
  });

  useEffect(() => {
    if (!estaAberto) {
      setTermoAnilist("");
      setResultados([]);
      setNovoManga({ titulo: "", capa: "", capitulo_atual: 0, total_capitulos: 0, status: "Planejo Ler", sinopse: "", favorito: false });
    }
  }, [estaAberto]);

  // ==========================================
  // 🧠 SESSÃO 3: MOTOR DE BUSCA
  // ==========================================
  async function executarBusca() {
    if (termoAnilist.length < 3) return;
    
    setBuscando(true);
    setResultados([]); 

    try {
      let termoFinal = termoAnilist;

      if (abaPrincipal !== "FILME" && abaPrincipal !== "LIVRO") {
        const { data: cacheHit } = await supabase.from('search_cache').select('resultado_ia').ilike('termo_original', termoAnilist).maybeSingle();

        if (cacheHit) {
          termoFinal = cacheHit.resultado_ia;
        } else {
          const resIA = await fetch('/api/tradutor-ia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ termo: termoAnilist })
          });
          
          if (resIA.ok) {
            const jsonIA = await resIA.json();
            if (jsonIA.resultado && !jsonIA.resultado.includes('⚠️')) {
              termoFinal = jsonIA.resultado;
              await supabase.from('search_cache').insert([{ termo_original: termoAnilist, resultado_ia: termoFinal }]);
            }
          }
        }
      }

      if (abaPrincipal === "FILME") {
        const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY; 
        if (!TMDB_API_KEY) {
          alert("⚠️ Hunter, a API Key do TMDB está faltando!");
          setBuscando(false);
          return;
        }
        try {
          const resTmdb = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(termoFinal)}`);
          const jsonTmdb = await resTmdb.json();
          if (jsonTmdb.results) {
            setResultados(jsonTmdb.results.slice(0, 5).map((m: any): ResultadoBusca => ({
              id: m.id, titulo: m.title, 
              capa: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : "https://placehold.co/400x600/1f1f22/52525b.png?text=SEM+CAPA",
              total: 1, sinopse: m.overview, fonte: "TMDB"
            })));
          }
        } catch (e) { console.error(e); }

      } else if (abaPrincipal === "LIVRO") {
        const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;
        const urlBusca = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(termoFinal)}&maxResults=5&langRestrict=pt${GOOGLE_API_KEY ? `&key=${GOOGLE_API_KEY}` : ''}`;

        try {
          const resBooks = await fetch(urlBusca);
          const jsonBooks = await resBooks.json();
          if (jsonBooks.items) {
            setResultados(jsonBooks.items.map((m: any): ResultadoBusca => {
              const links = m.volumeInfo?.imageLinks;
              const isbns = m.volumeInfo?.industryIdentifiers;
              const isbn13 = isbns?.find((id: any) => id.type === "ISBN_13")?.identifier;
              return {
                id: m.id, titulo: m.volumeInfo?.title, 
                capa: links?.thumbnail?.replace('http:', 'https:') || (isbn13 ? `https://covers.openlibrary.org/b/isbn/${isbn13}-L.jpg` : "https://placehold.co/400x600/1f1f22/52525b.png?text=SEM+CAPA"),
                total: m.volumeInfo?.pageCount || 1, sinopse: m.volumeInfo?.description, fonte: "Google Books"
              };
            }));
          }
        } catch (e) { console.error(e); }

      } else {
        try {
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
          }
        } catch (e) { console.error(e); }
      }
    } catch (err) { console.error(err); } finally { setBuscando(false); }
  }

  // ==========================================
  // 🛠️ SESSÃO 4: AÇÕES E SALVAMENTO (CIRÚRGICO)
  // ==========================================
  async function traduzirSinopse() {
    if (!novoManga.sinopse) return;
    setTraduzindo(true);
    try {
      const textoLimpo = novoManga.sinopse.replace(/<[^>]*>?/gm, '');
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt-BR&dt=t&q=${encodeURIComponent(textoLimpo)}`);
      const json = await res.json();
      setNovoManga(prev => ({ ...prev, sinopse: json[0].map((item: any) => item[0]).join('') }));
    } catch { alert("Erro na tradução."); } finally { setTraduzindo(false); }
  }

  async function salvarObraFinal() {
    if (!usuarioAtual) return;
    setSalvando(true);
    
    // 1. Mapeamento de Tabela
    const tabelaDb = abaPrincipal === "MANGA" ? "mangas" : abaPrincipal === "ANIME" ? "animes" : abaPrincipal === "FILME" ? "filmes" : "livros";
    
    // 2. CONSISTÊNCIA: Auto-completar se o status for 'Completos'
    let progressoFinal = novoManga.capitulo_atual;
    if (novoManga.status === "Completos" && novoManga.total_capitulos > 0) {
      progressoFinal = novoManga.total_capitulos;
    }

    // 3. TRIGGER DE MISSÃO: Data ISO para o Perfil detectar 'atividade hoje'
    const obraParaSalvar = { 
      ...novoManga, 
      capitulo_atual: progressoFinal,
      usuario: usuarioAtual, 
      ultima_leitura: new Date().toISOString() 
    };

    const { error } = await supabase.from(tabelaDb).insert([obraParaSalvar]);
    
    if (!error) { 
      aoSalvar(obraParaSalvar); 
      fechar(); 
    } else {
      alert("Erro ao salvar Hunter: " + error.message);
    }
    setSalvando(false);
  }

  // ==========================================
  // 🖥️ SESSÃO 5: RENDERIZAÇÃO
  // ==========================================
  if (!estaAberto) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111114] w-full max-w-2xl p-8 rounded-[2rem] border border-zinc-700 shadow-2xl relative">
        <button onClick={fechar} className="absolute top-6 right-6 text-zinc-500 hover:text-white p-2">✕</button>
        
        {!novoManga.titulo ? (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-green-500 uppercase italic tracking-tighter">Hunter Search S+</h3>
            <div className="flex gap-3">
              <input 
                autoFocus 
                type="text" 
                className="flex-1 bg-zinc-950 p-5 rounded-2xl border border-zinc-800 outline-none text-white text-lg font-bold placeholder:text-zinc-700" 
                placeholder="Digite a obra e aperte ENTER..." 
                value={termoAnilist} 
                onChange={(e) => setTermoAnilist(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && executarBusca()} 
              />
              <button onClick={executarBusca} disabled={buscando} className="px-8 bg-green-600 hover:bg-green-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-black uppercase tracking-widest rounded-2xl transition-all">
                {buscando ? "..." : "Buscar"}
              </button>
            </div>

            <div className="mt-4 max-h-64 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {resultados.map((m: ResultadoBusca) => (
                <div key={m.id} onClick={() => setNovoManga({ titulo: m.titulo, capa: m.capa, capitulo_atual: 0, total_capitulos: m.total, status: "Planejo Ler", sinopse: m.sinopse, favorito: false })} className="p-4 bg-zinc-900/50 rounded-2xl hover:bg-zinc-800 cursor-pointer flex gap-4 items-center border border-zinc-800 transition-all group">
                  <div className="relative"><img src={m.capa} className="w-12 h-16 object-cover rounded-xl" /><span className="absolute -top-2 -left-2 bg-black text-[6px] px-2 py-1 rounded-md border border-zinc-700 text-zinc-500 font-black">{m.fonte}</span></div>
                  <p className="font-bold text-sm group-hover:text-green-500">{m.titulo}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
            <div className="flex gap-6 p-6 bg-zinc-900/50 rounded-3xl border border-zinc-800">
              <img src={novoManga.capa} className="w-28 h-40 object-cover rounded-2xl shadow-2xl" />
              <div className="flex-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Obra Selecionada</p>
                <h2 className="text-2xl font-bold text-white mb-2 leading-tight italic">{novoManga.titulo}</h2>
                <button onClick={traduzirSinopse} disabled={traduzindo} className="text-[9px] font-black uppercase text-green-500 hover:text-white transition-colors">
                  {traduzindo ? "Traduzindo..." : "🌐 Traduzir Sinopse"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase mb-3 ml-1 tracking-widest">
                  Aonde parou? ({abaPrincipal === "MANGA" ? "Capítulo" : abaPrincipal === "ANIME" ? "Episódio" : abaPrincipal === "LIVRO" ? "Página" : "Parte"})
                </p>
                <input type="number" className="w-full bg-zinc-950 p-5 rounded-2xl border border-zinc-800 outline-none text-2xl font-bold text-green-500" value={novoManga.capitulo_atual} onChange={e => setNovoManga({...novoManga, capitulo_atual: parseInt(e.target.value) || 0})} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase mb-3 ml-1 tracking-widest">Status Inicial</p>
                <select value={novoManga.status} onChange={(e) => setNovoManga({...novoManga, status: e.target.value})} className="w-full bg-zinc-950 p-5 rounded-2xl border border-zinc-800 text-sm font-bold text-white uppercase cursor-pointer">
                  <option value="Lendo">{abaPrincipal === "ANIME" || abaPrincipal === "FILME" ? "Assistindo" : "Lendo"}</option>
                  <option value="Planejo Ler">{abaPrincipal === "ANIME" || abaPrincipal === "FILME" ? "Planejo Assistir" : "Planejo Ler"}</option>
                  <option value="Completos">Completos</option>
                  <option value="Pausados">Pausados</option>
                  <option value="Dropados">Dropados</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setNovoManga({titulo:"", capa:"", capitulo_atual:0, total_capitulos:0, status:"Planejo Ler", sinopse:"", favorito: false})} className="flex-1 py-5 bg-zinc-800 text-zinc-400 rounded-2xl font-bold uppercase text-xs">Voltar</button>
              <button onClick={salvarObraFinal} disabled={salvando} className="flex-[2] py-5 bg-green-600 text-white rounded-2xl font-bold uppercase text-xs shadow-lg shadow-green-600/20">{salvando ? "Salvando..." : "Salvar na Estante"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}