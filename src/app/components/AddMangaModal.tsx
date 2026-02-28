"use client";
import { useState, useEffect } from "react";
import { supabase } from "../supabase";

interface AddMangaModalProps {
  estaAberto: boolean;
  fechar: () => void;
  usuarioAtual: string;
  aoSalvar: (novoManga: any) => void;
}

export default function AddMangaModal({ estaAberto, fechar, usuarioAtual, aoSalvar }: AddMangaModalProps) {
  const [termoAnilist, setTermoAnilist] = useState("");
  const [resultadosAnilist, setResultadosAnilist] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [traduzindo, setTraduzindo] = useState(false);
  const [salvando, setSalvando] = useState(false); // ✅ NOVO: Estado para travar o botão durante o envio
  const [novoManga, setNovoManga] = useState({ 
    titulo: "", 
    capa: "", 
    capitulo_atual: 0, 
    total_capitulos: 0, 
    status: "Planejo Ler", 
    sinopse: "" 
  });

  useEffect(() => {
    if (!estaAberto) {
      setTermoAnilist("");
      setResultadosAnilist([]);
      setNovoManga({ titulo: "", capa: "", capitulo_atual: 0, total_capitulos: 0, status: "Planejo Ler", sinopse: "" });
      setSalvando(false);
    }
  }, [estaAberto]);

  // ==========================================
  // [SISTEMA DE BUSCA S+] - I.A. na Linha de Frente -> AniList -> MAL
  // ==========================================
  useEffect(() => {
    if (termoAnilist.length < 3) {
      setResultadosAnilist([]);
      return;
    }
    
    // 1.2 segundos de delay. Como a IA vai agir em todas as buscas, 
    // precisamos garantir que você parou de digitar para não gastar sua cota à toa.
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        let resultados = [];
        let termoInteligente = termoAnilist; // Começa com o que você digitou

        // 🧰 Função Auxiliar 1: Busca no AniList
        const buscarAnilist = async (termo: string) => {
          const res = await fetch("https://graphql.anilist.co", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              query: `query ($search: String) { Page(perPage: 5) { media(search: $search, type: MANGA) { id title { romaji english } coverImage { large } chapters description } } }`,
              variables: { search: termo }
            })
          });
          const json = await res.json();
          return json.data?.Page?.media || [];
        };

        // 🧰 Função Auxiliar 2: Busca no MyAnimeList
        const buscarMAL = async (termo: string) => {
          const res = await fetch(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(termo)}&limit=5`);
          const json = await res.json();
          if (json.data && json.data.length > 0) {
            return json.data.map((m: any) => ({
              id: m.mal_id,
              title: { romaji: m.title, english: m.title_english },
              coverImage: { large: m.images?.jpg?.image_url || "" },
              chapters: m.chapters || 0,
              description: m.synopsis || ""
            }));
          }
          return [];
        };

        // 🎯 1º PASSO: I.A. OTIMIZADORA (O Cérebro age primeiro)
        console.log("🧠 Perguntando para a I.A. o nome real de:", termoAnilist);
        
        const resIA = await fetch('/api/tradutor-ia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ termo: termoAnilist })
        });
        
        if (resIA.ok) {
          const jsonIA = await resIA.json();
          
          // 🛡️ REDE DE SEGURANÇA:
          if (jsonIA.resultado && !jsonIA.resultado.includes('⚠️')) {
            termoInteligente = jsonIA.resultado;
            console.log(`🤖 IA Sugeriu: "${termoInteligente}"`);
          } else {
            console.warn("⚠️ Cota da IA excedida ou erro. Usando termo original para não travar a busca.");
            termoInteligente = termoAnilist; 
          }
        }

        // 🎯 2º PASSO: AniList (Agora armado com o nome perfeito)
        resultados = await buscarAnilist(termoInteligente);

        // 🎯 3º PASSO: MyAnimeList (Caso a obra seja muito obscura e fuja do AniList)
        if (resultados.length === 0) {
          resultados = await buscarMAL(termoInteligente);
        }

        setResultadosAnilist(resultados);

      } catch (err) {
        console.error("❌ Erro no motor de busca S+:", err);
      } finally {
        setBuscando(false);
      }
    }, 1200); 
    
    return () => clearTimeout(t);
  }, [termoAnilist]);
  
  // ==========================================
  // [CORREÇÃO MASTER] - Novo Motor: Google Translate
  // ==========================================
  async function traduzirSinopse() {
    if (!novoManga.sinopse) {
      alert("⚠️ Esta obra não possui sinopse para traduzir.");
      return;
    }
    
    setTraduzindo(true);
    try {
      const textoLimpo = novoManga.sinopse.replace(/<[^>]*>?/gm, '');
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt-BR&dt=t&q=${encodeURIComponent(textoLimpo)}`);
      const json = await res.json();
      const textoTraduzido = json[0].map((item: any) => item[0]).join('');

      if (textoTraduzido) {
        setNovoManga(prev => ({ ...prev, sinopse: textoTraduzido }));
        alert("✅ Sinopse traduzida com sucesso!");
      } else {
        alert("⚠️ Não foi possível traduzir o texto.");
      }
    } catch {
      alert("❌ Erro na conexão de tradução. Tente novamente.");
    } finally {
      setTraduzindo(false);
    }
  }

  // ==========================================
  // ✅ [NOVO] LÓGICA DE SALVAR + SINCRONIZAR
  // ==========================================
  async function salvarObraFinal() {
    if (!usuarioAtual) return alert("Erro: Hunter não identificado!");
    setSalvando(true);

    const dadosManga = {
      titulo: novoManga.titulo,
      capa: novoManga.capa,
      capitulo_atual: novoManga.capitulo_atual,
      total_capitulos: novoManga.total_capitulos,
      status: novoManga.status,
      sinopse: novoManga.sinopse,
      usuario: usuarioAtual,
      ultima_leitura: new Date().toISOString()
    };

    // 1. Salva na Estante Local (Supabase)
    const { error } = await supabase.from("mangas").insert([dadosManga]);

    if (error) {
      alert("Erro ao salvar: " + error.message);
      setSalvando(false);
      return;
    }

    // 2. Sincroniza com o AniList em background
    try {
      const { data: perfil } = await supabase
        .from("perfis")
        .select("anilist_token")
        .eq("nome_original", usuarioAtual)
        .single();

      if (perfil && perfil.anilist_token) {
        await fetch('/api/anilist/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            titulo: novoManga.titulo,
            capitulo: novoManga.capitulo_atual,
            statusLocal: novoManga.status,
            token: perfil.anilist_token,
            acao: "SALVAR"
          })
        });
      }
    } catch (err) {
      console.error("Falha ao sincronizar com AniList no momento do cadastro.", err);
    }

    // 3. Conclui e fecha
    setSalvando(false);
    aoSalvar(novoManga);
    fechar();
  }

  if (!estaAberto) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#111114] w-full max-w-2xl p-8 rounded-[2rem] border border-zinc-700 shadow-2xl relative">
        <button onClick={fechar} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors p-2">✕</button>
        
        {!novoManga.titulo ? (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-green-500 uppercase tracking-tighter">Adicionar ao Perfil: {usuarioAtual}</h3>
            
            <input 
              autoFocus 
              type="text" 
              className="w-full bg-zinc-950 p-5 rounded-2xl border border-zinc-800 focus:border-green-500 outline-none text-lg text-white shadow-inner" 
              placeholder="Digite o nome do mangá..." 
              value={termoAnilist} 
              onChange={(e) => setTermoAnilist(e.target.value)} 
            />

            <div className="mt-4 max-h-64 overflow-y-auto space-y-3 custom-scrollbar pr-2">
              {resultadosAnilist.map(m => (
                <div 
                  key={m.id} 
                  onClick={() => setNovoManga({ 
                    titulo: m.title.romaji || m.title.english, 
                    capa: m.coverImage.large, 
                    capitulo_atual: 0, 
                    total_capitulos: m.chapters || 0, 
                    status: "Planejo Ler", 
                    sinopse: m.description || "" 
                  })} 
                  className="p-4 bg-zinc-900/50 rounded-2xl hover:bg-zinc-800 cursor-pointer flex gap-4 items-center border border-zinc-800 transition-all group"
                >
                  <img src={m.coverImage.large} className="w-12 h-16 object-cover rounded-xl shadow-lg" alt="" />
                  <p className="font-bold text-sm group-hover:text-green-500 transition-colors">{m.title.romaji || m.title.english}</p>
                </div>
              ))}
              {buscando && <div className="text-center p-4 text-green-500 animate-pulse font-bold text-xs">PESQUISANDO NO ANILIST...</div>}
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
            <div className="flex gap-6 p-6 bg-zinc-900/50 rounded-3xl border border-zinc-800">
              <img src={novoManga.capa} className="w-28 h-40 object-cover rounded-2xl shadow-2xl" alt="" />
              <div className="flex-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Obra Selecionada</p>
                <h2 className="text-2xl font-bold text-white mb-4 leading-tight">{novoManga.titulo}</h2>
                <button 
                  onClick={traduzirSinopse}
                  className={`text-[10px] px-4 py-2 rounded-full font-bold border transition-all uppercase tracking-tighter ${traduzindo ? 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-wait' : 'bg-blue-600/10 text-blue-400 border-blue-500/20 hover:bg-blue-600 hover:text-white'}`}
                  disabled={traduzindo}
                >
                  {traduzindo ? "🔄 Traduzindo..." : "✨ Traduzir Sinopse"}
                </button>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase mb-3 ml-1 tracking-widest">Aonde você parou? (Capítulo)</p>
              <input 
                type="number" 
                className="w-full bg-zinc-950 p-5 rounded-2xl border border-zinc-800 outline-none focus:border-green-500 text-2xl font-bold text-green-500" 
                value={novoManga.capitulo_atual} 
                onChange={e => setNovoManga({...novoManga, capitulo_atual: parseInt(e.target.value) || 0})} 
              />
              <p className="text-[10px] text-zinc-600 mt-2 ml-1">Total da obra: {novoManga.total_capitulos || 'Desconhecido'} capítulos.</p>
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div className="flex gap-4">
              <button 
                onClick={() => setNovoManga({titulo:"", capa:"", capitulo_atual:0, total_capitulos:0, status:"Planejo Ler", sinopse:""})} 
                disabled={salvando}
                className="flex-1 py-5 bg-zinc-800 text-zinc-400 rounded-2xl font-bold hover:bg-zinc-700 transition-colors uppercase text-xs tracking-widest disabled:opacity-50"
              >
                Voltar
              </button>
              
              <button 
                onClick={salvarObraFinal} 
                disabled={salvando}
                className="flex-[2] py-5 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-500 shadow-lg shadow-green-900/30 transition-all uppercase text-xs tracking-widest disabled:opacity-50 disabled:cursor-wait"
              >
                {salvando ? "Sincronizando..." : "Salvar na Estante"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}