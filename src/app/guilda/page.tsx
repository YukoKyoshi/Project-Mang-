"use client";

import { supabase } from "../supabase";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";

interface Mensagem {
  id: number;
  usuario: string;
  mensagem: string;
  tipo: string;
  criado_em: string;
}

interface Perfil {
  nome_original: string;
  nome_exibicao: string;
  avatar: string;
  cor_tema: string;
  esmolas: number;
}

// ✅ Expandimos as estatísticas para abraçar todos os novos rankings
interface EstatisticasHunter extends Perfil {
  total_obras: number;
  total_capitulos: number;
  tempo_vida: number;
  total_favoritos: number;
  elo: string;
}

export default function GuildaPage() {
  const [usuarioAtivo, setUsuarioAtivo] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Estados do Ranking
  const [abaAtiva, setAbaAtiva] = useState<"CHAT" | "RANKING">("CHAT");
  const [filtroRanking, setFiltroRanking] = useState<"OBRAS" | "ESMOLAS" | "TEMPO" | "CAPITULOS" | "FAVORITOS">("OBRAS");
  const [estatisticas, setEstatisticas] = useState<EstatisticasHunter[]>([]);
  const [carregandoRanking, setCarregandoRanking] = useState(false);

  useEffect(() => {
    const hunter = sessionStorage.getItem("hunter_ativo");
    if (!hunter) { window.location.href = '/'; return; }
    setUsuarioAtivo(hunter);
    
    carregarDados();
    
    const intervalo = setInterval(buscarMensagens, 10000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (scrollRef.current && abaAtiva === "CHAT") {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensagens, abaAtiva]);

  useEffect(() => {
    if (abaAtiva === "RANKING" && estatisticas.length === 0) {
      gerarRanking();
    }
  }, [abaAtiva]);

  async function carregarDados() {
    await buscarPerfis();
    await buscarMensagens();
  }

  async function buscarPerfis() {
    const { data } = await supabase.from("perfis").select("*");
    if (data) setPerfis(data);
  }

  async function buscarMensagens() {
    const { data } = await supabase
      .from("guilda_mensagens")
      .select("*")
      .order("criado_em", { ascending: true })
      .limit(100);
    if (data) setMensagens(data);
  }

  // ✅ NOVO Motor de Estatísticas Avançadas
  async function gerarRanking() {
    setCarregandoRanking(true);
    
    // Puxamos os dados essenciais para o cálculo
    const { data: m } = await supabase.from("mangas").select("usuario, capitulo_atual, favorito");
    const { data: a } = await supabase.from("animes").select("usuario, capitulo_atual, favorito");
    const { data: f } = await supabase.from("filmes").select("usuario, capitulo_atual, status, favorito");
    const { data: l } = await supabase.from("livros").select("usuario, capitulo_atual, favorito");

    const statsByUser: Record<string, { obras: number, caps: number, tempoMin: number, favs: number }> = {};

    // Inicializa todos os perfis com zero
    perfis.forEach(p => {
      statsByUser[p.nome_original] = { obras: 0, caps: 0, tempoMin: 0, favs: 0 };
    });

    const processarTabela = (dados: any[] | null, tipo: "anime" | "filme" | "outro") => {
      (dados || []).forEach(obra => {
        if (!statsByUser[obra.usuario]) statsByUser[obra.usuario] = { obras: 0, caps: 0, tempoMin: 0, favs: 0 };
        
        const userStats = statsByUser[obra.usuario];
        userStats.obras += 1;
        userStats.caps += (obra.capitulo_atual || 0);
        if (obra.favorito) userStats.favs += 1;

        if (tipo === "anime") {
          userStats.tempoMin += (obra.capitulo_atual || 0) * 23; // 23 min por EP
        } else if (tipo === "filme" && obra.status === "Completos") {
          userStats.tempoMin += 120; // 2h por filme completo
        }
      });
    };

    processarTabela(m, "outro");
    processarTabela(a, "anime");
    processarTabela(f, "filme");
    processarTabela(l, "outro");

    const statusCompletos = perfis.map(p => {
      const s = statsByUser[p.nome_original] || { obras: 0, caps: 0, tempoMin: 0, favs: 0 };
      
      let eloTier = "BRONZE";
      if (s.obras >= 1000) eloTier = "DIVINDADE";
      else if (s.obras >= 500) eloTier = "DESAFIANTE";
      else if (s.obras >= 200) eloTier = "MESTRE";
      else if (s.obras >= 100) eloTier = "DIAMANTE";

      return {
        ...p,
        esmolas: p.esmolas || 0,
        total_obras: s.obras,
        total_capitulos: s.caps,
        tempo_vida: Math.floor(s.tempoMin / 60), // Converte para Horas
        total_favoritos: s.favs,
        elo: eloTier
      };
    });

    setEstatisticas(statusCompletos);
    setCarregandoRanking(false);
  }

  async function enviarMensagem(e: React.FormEvent) {
    e.preventDefault();
    if (!novaMensagem.trim() || !usuarioAtivo) return;

    setEnviando(true);
    const msg = novaMensagem;
    setNovaMensagem(""); 

    const { error } = await supabase.from("guilda_mensagens").insert([{
      usuario: usuarioAtivo,
      mensagem: msg,
      tipo: "chat"
    }]);

    if (!error) {
      await buscarMensagens();
    } else {
      alert("Erro do Banco: " + error.message);
      console.error(error);
    }
    setEnviando(false);
  }

  function formatarHora(dataIso: string) {
    const data = new Date(dataIso);
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function getAvatar(nomeUsuario: string) {
    const p = perfis.find(p => p.nome_original === nomeUsuario);
    return p?.avatar || "👤";
  }

  function getCor(nomeUsuario: string) {
    const p = perfis.find(p => p.nome_original === nomeUsuario);
    if (!p) return "text-zinc-500";
    const cores: any = { verde: "text-green-500", azul: "text-blue-500", roxo: "text-purple-500", laranja: "text-orange-500" };
    return p.cor_tema?.startsWith('#') ? `text-[${p.cor_tema}]` : (cores[p.cor_tema] || "text-green-500");
  }

  // Ordenação dinâmica com base no filtro atual
  const huntersOrdenados = [...estatisticas].sort((a, b) => {
    if (filtroRanking === "OBRAS") return b.total_obras - a.total_obras;
    if (filtroRanking === "ESMOLAS") return b.esmolas - a.esmolas;
    if (filtroRanking === "TEMPO") return b.tempo_vida - a.tempo_vida;
    if (filtroRanking === "CAPITULOS") return b.total_capitulos - a.total_capitulos;
    if (filtroRanking === "FAVORITOS") return b.total_favoritos - a.total_favoritos;
    return 0;
  });

  return (
    <main className="min-h-screen bg-[#040405] text-white p-6 md:p-12 relative overflow-hidden flex flex-col">
      {/* HEADER */}
      <header className="flex justify-between items-center mb-8 relative z-20 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter text-blue-500">A Guilda</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500 mt-1">Conexão Global Sincronizada</p>
        </div>
        <Link href="/" className="px-6 py-3 rounded-2xl border border-white/5 text-[10px] font-black uppercase text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
          ← Voltar à Base
        </Link>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0 relative z-20">
        
        {/* PAINEL LATERAL: HUNTERS ATIVOS */}
        <aside className="lg:w-80 flex flex-col gap-4">
          <div className="bg-[#0e0e11]/95 border border-zinc-800 rounded-[2rem] p-6 flex-1">
            <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6 border-b border-zinc-800 pb-4">Hunters Registrados</h2>
            <div className="space-y-4 overflow-y-auto custom-scrollbar max-h-[60vh] pr-2">
              {perfis.map(p => (
                <div key={p.nome_original} className="flex items-center gap-4 bg-black/40 p-3 rounded-2xl border border-white/5">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-900 flex items-center justify-center text-xl shrink-0">
                    {p.avatar?.startsWith('http') ? <img src={p.avatar} className="w-full h-full object-cover" /> : <span>{p.avatar}</span>}
                  </div>
                  <div className="overflow-hidden">
                    <p className={`font-black text-xs truncate ${p.cor_tema?.startsWith('#') ? '' : getCor(p.nome_original)}`} style={p.cor_tema?.startsWith('#') ? { color: p.cor_tema } : {}}>{p.nome_exibicao}</p>
                    <p className="text-[8px] text-zinc-500 uppercase tracking-widest mt-1">ID: {p.nome_original}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* MURAL PRINCIPAL / RANKING */}
        <section className="flex-1 bg-[#0e0e11]/95 border border-zinc-800 rounded-[2.5rem] flex flex-col overflow-hidden relative">
          
          {/* NAVEGAÇÃO INTERNA (CHAT / RANKING) */}
          <div className="flex gap-4 p-6 border-b border-zinc-800 bg-black/20">
            <button onClick={() => setAbaAtiva("CHAT")} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${abaAtiva === "CHAT" ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-500 hover:text-white'}`}>💬 Chat Global</button>
            <button onClick={() => setAbaAtiva("RANKING")} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${abaAtiva === "RANKING" ? 'bg-yellow-600 text-white' : 'bg-zinc-900 text-zinc-500 hover:text-white'}`}>🏆 Pódio / Ranks</button>
          </div>

          {/* ----------------- ABA 1: CHAT GLOBAL ----------------- */}
          {abaAtiva === "CHAT" && (
            <>
              <div ref={scrollRef} className="flex-1 p-8 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                {mensagens.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-zinc-600 font-bold uppercase text-xs tracking-widest italic">
                    O mural está silencioso...
                  </div>
                ) : (
                  mensagens.map(msg => {
                    const isMe = msg.usuario === usuarioAtivo;
                    return (
                      <div key={msg.id} className={`flex gap-4 max-w-[80%] ${isMe ? 'self-end flex-row-reverse' : 'self-start'}`}>
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-zinc-900 shrink-0 flex items-center justify-center text-sm border border-zinc-800 mt-1">
                          {getAvatar(msg.usuario)?.startsWith('http') ? <img src={getAvatar(msg.usuario)} className="w-full h-full object-cover" /> : <span>{getAvatar(msg.usuario)}</span>}
                        </div>
                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className={`text-[10px] font-black uppercase ${getCor(msg.usuario)}`}>{msg.usuario}</span>
                            <span className="text-[8px] text-zinc-600 font-bold">{formatarHora(msg.criado_em)}</span>
                          </div>
                          <div className={`p-4 rounded-2xl text-sm leading-relaxed border ${isMe ? 'bg-blue-600/10 border-blue-500/20 text-blue-100 rounded-tr-sm' : 'bg-zinc-900 border-zinc-800 text-zinc-300 rounded-tl-sm'}`}>
                            {msg.mensagem}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-6 bg-black/40 border-t border-zinc-800">
                <form onSubmit={enviarMensagem} className="flex gap-4">
                  <input 
                    type="text" 
                    placeholder="Deixe uma mensagem no mural da guilda..." 
                    className="flex-1 bg-zinc-950 border border-zinc-800 p-5 rounded-2xl outline-none text-white text-sm focus:border-blue-500/50 transition-all"
                    value={novaMensagem}
                    onChange={e => setNovaMensagem(e.target.value)}
                    maxLength={250}
                  />
                  <button 
                    type="submit" 
                    disabled={enviando || !novaMensagem.trim()}
                    className="px-8 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Enviar
                  </button>
                </form>
              </div>
            </>
          )}

          {/* ----------------- ABA 2: RANKING EXPANDIDO ----------------- */}
          {abaAtiva === "RANKING" && (
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex flex-col gap-6">
              
              {/* Filtros Dinâmicos */}
              <div className="flex flex-wrap justify-center gap-3 mb-4">
                <button onClick={() => setFiltroRanking("OBRAS")} className={`px-4 py-2 rounded-xl border text-[9px] font-black uppercase transition-all ${filtroRanking === "OBRAS" ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-black/50 border-zinc-800 text-zinc-500 hover:text-white'}`}>📚 Mais Viciados</button>
                <button onClick={() => setFiltroRanking("ESMOLAS")} className={`px-4 py-2 rounded-xl border text-[9px] font-black uppercase transition-all ${filtroRanking === "ESMOLAS" ? 'bg-yellow-600/20 border-yellow-500 text-yellow-400' : 'bg-black/50 border-zinc-800 text-zinc-500 hover:text-white'}`}>🪙 Mais Ricos</button>
                <button onClick={() => setFiltroRanking("TEMPO")} className={`px-4 py-2 rounded-xl border text-[9px] font-black uppercase transition-all ${filtroRanking === "TEMPO" ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'bg-black/50 border-zinc-800 text-zinc-500 hover:text-white'}`}>⏳ Veteranos (Horas)</button>
                <button onClick={() => setFiltroRanking("CAPITULOS")} className={`px-4 py-2 rounded-xl border text-[9px] font-black uppercase transition-all ${filtroRanking === "CAPITULOS" ? 'bg-red-600/20 border-red-500 text-red-400' : 'bg-black/50 border-zinc-800 text-zinc-500 hover:text-white'}`}>🔥 Devoradores (Caps)</button>
                <button onClick={() => setFiltroRanking("FAVORITOS")} className={`px-4 py-2 rounded-xl border text-[9px] font-black uppercase transition-all ${filtroRanking === "FAVORITOS" ? 'bg-green-600/20 border-green-500 text-green-400' : 'bg-black/50 border-zinc-800 text-zinc-500 hover:text-white'}`}>⭐ Curadores</button>
              </div>

              {carregandoRanking ? (
                <div className="flex-1 flex items-center justify-center text-zinc-500 italic animate-pulse">Inspecionando Registros dos Hunters...</div>
              ) : (
                <div className="flex flex-col gap-4">
                  {huntersOrdenados.map((hunter, index) => {
                    const isTop1 = index === 0;
                    const isTop2 = index === 1;
                    const isTop3 = index === 2;
                    let medalha = "🏅";
                    if (isTop1) medalha = "👑"; else if (isTop2) medalha = "🥈"; else if (isTop3) medalha = "🥉";

                    // Define a cor de destaque e a label com base no filtro
                    let corTexto = "text-indigo-400";
                    let valor = hunter.total_obras;
                    let label = "Obras Lidas";

                    if (filtroRanking === "ESMOLAS") { corTexto = "text-yellow-500"; valor = hunter.esmolas; label = "Esmolas"; }
                    if (filtroRanking === "TEMPO") { corTexto = "text-purple-400"; valor = hunter.tempo_vida; label = "Horas Consumidas"; }
                    if (filtroRanking === "CAPITULOS") { corTexto = "text-red-400"; valor = hunter.total_capitulos; label = "Caps / Episódios"; }
                    if (filtroRanking === "FAVORITOS") { corTexto = "text-green-400"; valor = hunter.total_favoritos; label = "Obras Favoritas"; }

                    return (
                      <div key={hunter.nome_original} className={`flex items-center justify-between p-5 rounded-3xl border transition-all ${isTop1 ? 'bg-yellow-900/10 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.1)]' : isTop2 ? 'bg-zinc-800/20 border-zinc-400/50' : isTop3 ? 'bg-orange-900/10 border-orange-700/50' : 'bg-zinc-900/30 border-zinc-800'}`}>
                        
                        <div className="flex items-center gap-6">
                          <span className={`text-3xl font-black italic w-10 text-center ${isTop1 ? 'text-yellow-500 drop-shadow-md' : isTop2 ? 'text-zinc-300' : isTop3 ? 'text-orange-500' : 'text-zinc-600'}`}>#{index + 1}</span>
                          
                          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-zinc-950 flex items-center justify-center text-2xl border border-white/10 shrink-0">
                            {hunter.avatar?.startsWith('http') ? <img src={hunter.avatar} className="w-full h-full object-cover" /> : <span>{hunter.avatar}</span>}
                          </div>

                          <div>
                            <p className="font-black text-lg uppercase flex items-center gap-2">{hunter.nome_exibicao} {isTop1 || isTop2 || isTop3 ? <span className="text-xl">{medalha}</span> : ""}</p>
                            <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">RANK: <span className="text-white">{hunter.elo}</span></p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className={`text-3xl font-black italic ${corTexto}`}>{valor}</p>
                          <p className="text-[8px] text-zinc-500 uppercase tracking-widest">{label}</p>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </section>
      </div>
    </main>
  );
}