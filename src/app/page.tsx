"use client";

// ==========================================
// 📦 1. IMPORTAÇÕES E INTERFACES
// ==========================================
import AcessoMestre from "./components/AcessoMestre";
import { supabase } from "./supabase";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import MangaCard from "./components/MangaCard";
import AddMangaModal from "./components/AddMangaModal";
import MangaDetailsModal from "./components/MangaDetailsModal";
import AdminPanel from "./components/AdminPanel";
import ProfileSelection from "./components/ProfileSelection";
import UserProfile from "./components/UserProfile";

// A interface 'Manga' agora serve perfeitamente para 'Animes' também (episódios = capítulos)
interface Manga { 
  id: number; 
  titulo: string; 
  capa: string; 
  capitulo_atual: number; 
  total_capitulos: number; 
  status: string; 
  sinopse: string; 
  nota_pessoal: number; 
  nota_amigos: number; 
  comentarios: string; 
  usuario: string; 
  ultima_leitura: string; 
  favorito: boolean; 
}

// ==========================================
// 🎨 2. DICIONÁRIO DE AURAS (TEMAS)
// ==========================================
const TEMAS = {
  verde: { nome: "Verde Néon", bg: "bg-green-500", bgActive: "bg-green-600", text: "text-green-500", border: "border-green-500", shadow: "shadow-[0_0_20px_rgba(34,197,94,0.3)]", focus: "focus:border-green-500" },
  azul: { nome: "Azul Elétrico", bg: "bg-blue-500", bgActive: "bg-blue-600", text: "text-blue-500", border: "border-blue-500", shadow: "shadow-[0_0_20px_rgba(59,130,246,0.3)]", focus: "focus:border-blue-500" },
  roxo: { nome: "Roxo Carmesim", bg: "bg-purple-500", bgActive: "bg-purple-600", text: "text-purple-500", border: "border-purple-500", shadow: "shadow-[0_0_20px_rgba(168,85,247,0.3)]", focus: "focus:border-purple-500" },
  laranja: { nome: "Laranja Outono", bg: "bg-orange-500", bgActive: "bg-orange-600", text: "text-orange-500", border: "border-orange-500", shadow: "shadow-[0_0_20px_rgba(249,115,22,0.3)]", focus: "focus:border-orange-500" },
  admin: { nome: "Admin", bg: "bg-yellow-500", bgActive: "bg-yellow-600", text: "text-yellow-500", border: "border-yellow-500", shadow: "shadow-[0_0_20px_rgba(234,179,8,0.3)]", focus: "focus:border-yellow-500" },
  custom: { nome: "Cor Livre", bg: "bg-[var(--aura)]", bgActive: "bg-[var(--aura)] brightness-110", text: "text-[var(--aura)]", border: "border-[var(--aura)]", shadow: "shadow-[0_0_15px_var(--aura)]", focus: "focus:border-[var(--aura)]" }
};

export default function Home() {
  // ==========================================
  // 🔐 3. ESTADOS DE SEGURANÇA E ACESSO
  // ==========================================
  const [mestreAutorizado, setMestreAutorizado] = useState(false);
  const [usuarioAtual, setUsuarioAtual] = useState<string | null>(null);
  const [perfilAlvoParaBloqueio, setPerfilAlvoParaBloqueio] = useState<string | null>(null);
  const [pinDigitado, setPinDigitado] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // ==========================================
  // 📦 4. ESTADOS DE DADOS E INTERFACE
  // ==========================================
  const [abaPrincipal, setAbaPrincipal] = useState<"MANGA" | "ANIME">("MANGA"); // ✅ O Controlador das Abas
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [animes, setAnimes] = useState<Manga[]>([]); // ✅ Lista de Animes
  
  const [perfis, setPerfis] = useState<any[]>([]); 
  const [estaAbertoAdd, setEstaAbertoAdd] = useState(false);
  const [mangaDetalhe, setMangaDetalhe] = useState<Manga | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [filtroAtivo, setFiltroAtivo] = useState("Lendo");
  const [pesquisaInterna, setPesquisaInterna] = useState("");
  const [config, setConfig] = useState({ mostrar_busca: true, mostrar_stats: true, mostrar_backup: true });
  
  // --- SUB-SESSÃO 4.A: novo perfil --- //
  const [novoHunter, setNovoHunter] = useState({ nome: '', avatar: '👤', pin: '', cor: 'verde' });
  const [editandoNomeOriginal, setEditandoNomeOriginal] = useState<string | null>(null);
  const [mostrandoFormHunter, setMostrandoFormHunter] = useState(false);
  
  // --- SUB-SESSÃO 4.B: MOSTRANDO PERFIL --- //
  const [mostrandoPerfil, setMostrandoPerfil] = useState(false);
  const [pinAdminAberto, setPinAdminAberto] = useState(false);

  // --- SUB-SESSÃO 4.C: NOTIFICAÇÕES (TOAST) --- //
  const [toast, setToast] = useState({ visivel: false, mensagem: "", tipo: "sucesso" });

  function mostrarToast(mensagem: string, tipo: "sucesso" | "erro" = "sucesso") {
    setToast({ visivel: true, mensagem, tipo });
    setTimeout(() => { setToast(prev => ({ ...prev, visivel: false })); }, 4000);
  }

  // ==========================================
  // 🔄 5. LÓGICA DE INICIALIZAÇÃO
  // ==========================================
  useEffect(() => { 
    const mestre = sessionStorage.getItem("acesso_mestre");
    if (mestre === "true") {
      setMestreAutorizado(true);
      sessionStorage.setItem('estante_acesso', 'true');
    }
    const hunterSalvo = sessionStorage.getItem("hunter_ativo");
    if (hunterSalvo) setUsuarioAtual(hunterSalvo);
    
    const buscarConfigs = async () => {
      const { data } = await supabase.from("site_config").select("*").eq("id", 1).maybeSingle();
      if (data) setConfig(data);
    };

    buscarConfigs();
    buscarPerfis().then(() => setCarregando(false));
  }, []);

  useEffect(() => {
    if (usuarioAtual) {
      setIsAdmin(usuarioAtual === "Admin");
      buscarMangas();
      buscarAnimes(); // ✅ Carrega as duas listas ao mesmo tempo
    }
  }, [usuarioAtual]);

// ==========================================
// 🛠️ 6. FUNÇÕES DO BANCO DE DADOS
// ==========================================

async function buscarMangas() {
  if (!usuarioAtual || usuarioAtual === "Admin") return;
  const { data } = await supabase.from("mangas").select("*").eq("usuario", usuarioAtual).order("ultima_leitura", { ascending: false });
  if (data) setMangas(data as Manga[]);
}

// --- [NOVO] BUSCAR ANIMES ---
async function buscarAnimes() {
  if (!usuarioAtual || usuarioAtual === "Admin") return;
  const { data } = await supabase.from("animes").select("*").eq("usuario", usuarioAtual).order("ultima_leitura", { ascending: false });
  if (data) setAnimes(data as Manga[]);
}

//Buscar perfis (Hunters)//

async function buscarPerfis() {
  const { data } = await supabase.from("perfis").select("*");
  if (data) setPerfis(data);
}

// --- SINCRONIZAÇÃO COM ANILIST VIA SERVIDOR (ANTI-CORS HÍBRIDO) ---
async function sincronizarComAniList(titulo: string, capitulo: number, statusLocal: string, token: string, acao: "SALVAR" | "DELETAR" = "SALVAR", tipoObra: "MANGA" | "ANIME" = "MANGA") {
  try {
    const res = await fetch('/api/anilist/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, capitulo, statusLocal, token, acao, tipoObra })
    });
    
    const data = await res.json();
    
    if (data.success) {
       console.log(`✅ [Anti-CORS] "${titulo}" -> ${data.status} (${tipoObra})!`);
       mostrarToast(`"${titulo}" ${acao === "DELETAR" ? "removido do" : "salvo no"} AniList!`, "sucesso");
    } else {
       console.warn(`⚠️ Falha na sincronização do AniList:`, data.error);
       mostrarToast(`Falha no AniList: ${data.error}`, "erro");
    }
  } catch (error) {
    console.error("❌ Erro de comunicação com o túnel do servidor:", error);
    mostrarToast("Erro de conexão com o servidor.", "erro");
  }
}

// --- PUXAR E IMPORTAR DADOS DO ANILIST (AGORA PUXA A ABA ATUAL) ---
async function puxarProgressoDoAniList() {
  const perfilAtivo = perfis.find(p => p.nome_original === usuarioAtual);
  if (!perfilAtivo || !perfilAtivo.anilist_token) {
    mostrarToast("Você precisa conectar o AniList primeiro.", "erro");
    return;
  }

  mostrarToast(`📡 Buscando e importando ${abaPrincipal === "MANGA" ? "Mangás" : "Animes"} do AniList...`, "sucesso");
  
  try {
    const res = await fetch('/api/anilist/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: "PUXAR", token: perfilAtivo.anilist_token, tipoObra: abaPrincipal })
    });
    
    const anilistData = await res.json();
    
    if (anilistData.success) {
       let atualizacoes = 0;
       let importacoes = 0;
       const mapaStatusInverso: Record<string, string> = { "CURRENT": "Lendo", "COMPLETED": "Completos", "PLANNING": "Planejo Ler", "DROPPED": "Dropados", "PAUSED": "Pausados" };
       
       const listaExterna: any[] = [];
       anilistData.data.forEach((lista: any) => lista.entries.forEach((entry: any) => listaExterna.push(entry)));

       const listaLocal = abaPrincipal === "MANGA" ? mangas : animes;
       const tabelaDb = abaPrincipal === "MANGA" ? "mangas" : "animes";

       for (const entry of listaExterna) {
         const tituloRomaji = entry.media.title.romaji?.toLowerCase() || "";
         const tituloEnglish = entry.media.title.english?.toLowerCase() || "";
         
         const matchLocal = listaLocal.find(m => {
           const tLocal = m.titulo.toLowerCase();
           return (tituloRomaji && tLocal.includes(tituloRomaji)) || 
                  (tituloEnglish && tLocal.includes(tituloEnglish)) || 
                  (tituloRomaji && tituloRomaji.includes(tLocal));
         });

         const novoProgresso = entry.progress;
         const novoStatus = mapaStatusInverso[entry.status] || "Lendo";

         if (matchLocal) {
           if (novoProgresso !== matchLocal.capitulo_atual || novoStatus !== matchLocal.status) {
             await supabase.from(tabelaDb).update({ capitulo_atual: novoProgresso, status: novoStatus }).eq("id", matchLocal.id);
             atualizacoes++;
           }
         } else {
           const tituloFinal = entry.media.title.romaji || entry.media.title.english || "Desconhecido";
           await supabase.from(tabelaDb).insert([{
             titulo: tituloFinal,
             capa: entry.media.coverImage?.large || "https://via.placeholder.com/400x600.png?text=Sem+Capa",
             capitulo_atual: novoProgresso,
             total_capitulos: abaPrincipal === "MANGA" ? (entry.media.chapters || 0) : (entry.media.episodes || 0),
             status: novoStatus,
             sinopse: entry.media.description || "Importado do AniList",
             usuario: usuarioAtual,
             ultima_leitura: new Date().toISOString()
           }]);
           importacoes++;
         }
       }
       
       if (atualizacoes > 0 || importacoes > 0) {
         if (abaPrincipal === "MANGA") buscarMangas(); else buscarAnimes();
         mostrarToast(`Sincronização: ${importacoes} importados, ${atualizacoes} atualizados!`, "sucesso");
       } else {
         mostrarToast(`Seus ${abaPrincipal === "MANGA" ? "Mangás" : "Animes"} já estavam atualizados!`, "sucesso");
       }
    }
  } catch (e) {
    mostrarToast("Erro ao puxar dados do AniList.", "erro");
  }
}

// --- LÓGICA OTIMISTA E DINÂMICA (MANGÁS OU ANIMES) ---
async function atualizarCapitulo(manga: Manga, novo: number) {
  if (novo < 0) return;
  
  let novoStatus = manga.status;
  if (manga.total_capitulos > 0 && novo >= manga.total_capitulos) novoStatus = "Completos";
  else if (novo > 0 && (manga.status === "Planejo Ler" || manga.status === "Dropados" || manga.status === "Pausados")) novoStatus = "Lendo";
  
  const agora = new Date().toISOString();
  const tabelaDb = abaPrincipal === "MANGA" ? "mangas" : "animes";
  const setLista = abaPrincipal === "MANGA" ? setMangas : setAnimes;

  // 1. ATUALIZA A TELA IMEDIATAMENTE (Otimismo)
  setLista((prev: Manga[]) => prev.map(m => m.id === manga.id ? { ...m, capitulo_atual: novo, status: novoStatus, ultima_leitura: agora } : m));
  if (mangaDetalhe?.id === manga.id) {
    setMangaDetalhe(prev => prev ? { ...prev, capitulo_atual: novo, status: novoStatus, ultima_leitura: agora } : null);
  }

  // 2. SALVA NO BANCO DE DADOS
  const { error } = await supabase.from(tabelaDb).update({ 
    capitulo_atual: novo, 
    status: novoStatus, 
    ultima_leitura: agora 
  }).eq("id", manga.id);
  
  if (error) {
    alert("❌ Erro de conexão. Revertendo...");
    if (abaPrincipal === "MANGA") buscarMangas(); else buscarAnimes();
  }

  // 3. MANDA PARA O ANILIST
  const perfilAtivo = perfis.find(p => p.nome_original === usuarioAtual);
  if (perfilAtivo && perfilAtivo.anilist_token) {
    sincronizarComAniList(manga.titulo, novo, novoStatus, perfilAtivo.anilist_token, "SALVAR", abaPrincipal);
  }
}

async function atualizarDados(id: number, campos: any) {
  const tabelaDb = abaPrincipal === "MANGA" ? "mangas" : "animes";
  const setLista = abaPrincipal === "MANGA" ? setMangas : setAnimes;
  const listaAtual = abaPrincipal === "MANGA" ? mangas : animes;

  setLista((prev: Manga[]) => prev.map(m => m.id === id ? { ...m, ...campos } : m));
  if (mangaDetalhe?.id === id) setMangaDetalhe(prev => prev ? { ...prev, ...campos } : null);

  const { error } = await supabase.from(tabelaDb).update(campos).eq("id", id);
  
  if (error) {
    alert("❌ Erro de conexão. Revertendo alteração...");
    if (abaPrincipal === "MANGA") buscarMangas(); else buscarAnimes();
  }

  if (campos.status || campos.capitulo_atual !== undefined) {
    const mangaAlterado = listaAtual.find(m => m.id === id);
    const perfilAtivo = perfis.find(p => p.nome_original === usuarioAtual);
    
    if (mangaAlterado && perfilAtivo && perfilAtivo.anilist_token) {
      const progressoEnvio = campos.capitulo_atual !== undefined ? campos.capitulo_atual : mangaAlterado.capitulo_atual;
      const statusEnvio = campos.status || mangaAlterado.status;
      sincronizarComAniList(mangaAlterado.titulo, progressoEnvio, statusEnvio, perfilAtivo.anilist_token, "SALVAR", abaPrincipal);
    }
  }
}

// --- EXCLUSÃO COM ROTEAMENTO DINÂMICO ---
async function deletarMangaDaEstante(id: number) {
  const listaAtual = abaPrincipal === "MANGA" ? mangas : animes;
  const tabelaDb = abaPrincipal === "MANGA" ? "mangas" : "animes";
  
  const manga = listaAtual.find(m => m.id === id);
  if (!manga) return;

  if(confirm(`Tem certeza que deseja remover "${manga.titulo}" da sua estante?`)) {
    await supabase.from(tabelaDb).delete().eq("id", id);
    if (abaPrincipal === "MANGA") buscarMangas(); else buscarAnimes();

    const perfilAtivo = perfis.find(p => p.nome_original === usuarioAtual);
    if (perfilAtivo && perfilAtivo.anilist_token) {
      sincronizarComAniList(manga.titulo, manga.capitulo_atual, manga.status, perfilAtivo.anilist_token, "DELETAR", abaPrincipal);
    }
  }
}


// --- criar perfis ---
async function salvarHunter() {
  if (!novoHunter.nome) return alert("O nome é obrigatório!");

  const dados: any = { nome_exibicao: novoHunter.nome, avatar: novoHunter.avatar, pin: novoHunter.pin, cor_tema: novoHunter.cor };
  let error;

  if (editandoNomeOriginal) {
    const result = await supabase.from("perfis").update(dados).eq("nome_original", editandoNomeOriginal);
    error = result.error;
  } else {
    dados.nome_original = novoHunter.nome;
    const result = await supabase.from("perfis").insert([dados]);
    error = result.error;
  }

  if (error) alert("Erro: " + error.message);
  else { fecharFormularioHunter(); buscarPerfis(); }
}

function fecharFormularioHunter() {
  setMostrandoFormHunter(false);
  setEditandoNomeOriginal(null);
  setNovoHunter({ nome: '', avatar: '👤', pin: '', cor: 'verde' });
}

function prepararEdicao(perfil: any) {
  setNovoHunter({ nome: perfil.nome_exibicao, avatar: perfil.avatar, pin: perfil.pin || '', cor: perfil.cor_tema });
  setEditandoNomeOriginal(perfil.nome_original);
  setMostrandoFormHunter(true);
}

// ---- atualizar configs do site ----//
async function atualizarConfig(chave: string, valor: boolean) {
  const novaConfig = { ...config, [chave]: valor };
  setConfig(novaConfig); 

  const { error } = await supabase.from("site_config").update({ [chave]: valor }).eq("id", 1);
  if (error) alert("Erro ao salvar configuração: " + error.message);
}

// --- Deletar perfis ---//
async function deletarPerfil(perfil: any) {
  if (perfil.nome_original === "Admin") { alert("O perfil Administrador não pode ser removido."); return; }

  if (confirm(`Tens a certeza que queres remover o Hunter "${perfil.nome_exibicao}"? Esta ação é permanente.`)) {
    const { error } = await supabase.from("perfis").delete().eq("nome_original", perfil.nome_original);
    if (error) alert("Erro ao remover: " + error.message);
    else { alert("Hunter removido com sucesso."); buscarPerfis(); }
  }
}

  // ==========================================
  // 🔑 7. LÓGICA DE LOGIN E VALIDAÇÃO DE PIN
  // ==========================================
  
  // Função para validar o acesso do Hunter
  async function confirmarPin() {
    if (!perfilAlvoParaBloqueio) return;

    try {
      // 1. Busca o perfil atualizado no banco para validar o PIN
      const { data: perfil, error } = await supabase
        .from("perfis")
        .select("pin, nome_exibicao, avatar")
        .eq("nome_original", perfilAlvoParaBloqueio)
        .single();

      if (error || !perfil) {
        mostrarToast("Erro ao localizar caçador.", "erro");
        return;
      }

      // 2. Compara o PIN digitado com o PIN do banco de dados
      if (perfil.pin === pinDigitado) {
        sessionStorage.setItem("hunter_ativo", perfilAlvoParaBloqueio);
        sessionStorage.setItem("acesso_mestre", "true");
        sessionStorage.setItem("estante_acesso", "true");

        setUsuarioAtual(perfilAlvoParaBloqueio);
        setPerfilAlvoParaBloqueio(null);
        setPinDigitado("");
        mostrarToast(`Bem-vindo de volta, ${perfil.nome_exibicao}!`, "sucesso");
      } else {
        mostrarToast("PIN Incorreto. Acesso negado.", "erro");
        setPinDigitado("");
      }
    } catch (err) {
      console.error("Erro no login:", err);
    }
  }

  // Acionada quando clica em um card de perfil
  function tentarMudarPerfil(nomeOriginal: string) {
    if (nomeOriginal === "Admin") {
      setPinAdminAberto(true);
      return;
    }
    
    // Verifica se o perfil tem PIN para abrir o modal de senha
    const info = perfis.find(p => p.nome_original === nomeOriginal);
    if (info?.pin) { 
      setPerfilAlvoParaBloqueio(nomeOriginal); 
      setPinDigitado(""); 
    } else { 
      // Login direto se não houver PIN (Perfil público)
      setIsAdmin(false); 
      setUsuarioAtual(nomeOriginal); 
      sessionStorage.setItem('hunter_ativo', nomeOriginal); 
    }
  }

  // ==========================================
  // 🖥️ 8. INTERFACE DE SELEÇÃO (JSX)
  // ==========================================
  if (!mestreAutorizado) return <AcessoMestre aoAutorizar={() => { sessionStorage.setItem("acesso_mestre", "true"); sessionStorage.setItem("estante_acesso", "true"); setMestreAutorizado(true); }} />;

  if (!usuarioAtual) {
    return (
      <>
        {/* Renderiza a tela de seleção de perfis (Hunters) */}
        <ProfileSelection 
          perfis={perfis} // ✅ Vem do banco de dados (Sessão 6)
          temas={TEMAS} 
          tentarMudarPerfil={tentarMudarPerfil} 
          perfilAlvoParaBloqueio={perfilAlvoParaBloqueio} 
          pinDigitado={pinDigitado} 
          setPinDigitado={setPinDigitado} 
          confirmarPin={confirmarPin} 
          setPinAdminAberto={setPinAdminAberto} 
          pinAdminAberto={pinAdminAberto} 
        />

        {/* Modal de PIN para Administrador (Mestre) */}
        {pinAdminAberto && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/98 backdrop-blur-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-zinc-900 p-12 rounded-[3rem] border border-zinc-800 text-center space-y-8 shadow-[0_0_100px_rgba(0,0,0,1)] max-w-sm w-full">
              <h2 className="text-white font-black uppercase tracking-tighter text-2xl italic text-yellow-500">Admin Login</h2>
              <input 
                type="password" 
                maxLength={4} 
                autoFocus 
                placeholder="PIN"
                className="w-full bg-black border border-zinc-700 p-5 rounded-2xl text-center text-4xl font-bold text-white outline-none focus:border-yellow-500 transition-all font-mono" 
                onChange={(e) => { 
                  if (e.target.value === "5236") { 
                    setIsAdmin(true); 
                    setUsuarioAtual("Admin"); 
                    sessionStorage.setItem('hunter_ativo', 'Admin');
                    setPinAdminAberto(false); 
                  } 
                }} 
              />
              <button onClick={() => setPinAdminAberto(false)} className="text-[10px] text-zinc-600 hover:text-white uppercase font-black tracking-widest mt-4">Retornar</button>
            </div>
          </div>
        )}
      </>
    );
  }
  if (isAdmin) return <AdminPanel perfis={perfis} config={config} mostrandoFormHunter={mostrandoFormHunter} setMostrandoFormHunter={setMostrandoFormHunter} novoHunter={novoHunter} setNovoHunter={setNovoHunter} deletarPerfil={deletarPerfil} setUsuarioAtual={setUsuarioAtual} atualizarConfig={atualizarConfig} salvarHunter={salvarHunter} prepararEdicao={prepararEdicao} editandoNomeOriginal={editandoNomeOriginal} fecharFormularioHunter={fecharFormularioHunter} />;

  // ==========================================
  // 🖥️ 10. ESTANTE DE MANGÁS E ANIMES
  // ==========================================
  const perfilAtivo = perfis.find(p => p.nome_original === usuarioAtual) || { nome_exibicao: usuarioAtual, avatar: "👤", cor_tema: "verde" };
  const aura = perfilAtivo.cor_tema?.startsWith('#') ? TEMAS.custom : (TEMAS[perfilAtivo.cor_tema as keyof typeof TEMAS] || TEMAS.verde);
  
  // ✅ O Radar da Lista Ativa (Mangás ou Animes)
  const listaExibicao = abaPrincipal === "MANGA" ? mangas : animes;

  // --- SUB-SESSÃO: TRADUTOR DE FILTROS ---
  const filtrosManga = ["Todos", "Lendo", "Completos", "Planejo Ler", "Pausados", "Dropados"];
  const filtrosAnime = ["Todos", "Assistindo", "Completos", "Planejo Assistir", "Pausados", "Dropados"];
  const filtrosAtuais = abaPrincipal === "MANGA" ? filtrosManga : filtrosAnime;

  // Lógica de filtragem com tradução para Anime
  const obrasFiltradas = listaExibicao
     .filter(m => {
    if (filtroAtivo === "Todos") return true;

    // Se estivermos em Animes, traduzimos o botão da tela para o valor do Banco
    if (abaPrincipal === "ANIME") {
      if (filtroAtivo === "Assistindo") return m.status === "Lendo";
      if (filtroAtivo === "Planejo Assistir") return m.status === "Planejo Ler";
    }

    return m.status === filtroAtivo;
  })
  .filter(m => m.titulo.toLowerCase().includes(pesquisaInterna.toLowerCase()));

  return (
    <main className="min-h-screen bg-[#080808] p-6 md:p-12 text-white animate-in fade-in duration-700" style={perfilAtivo.cor_tema?.startsWith('#') ? { '--aura': perfilAtivo.cor_tema } as React.CSSProperties : {}}>
      
      {/* HEADER DA ESTANTE */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-16 border-b border-zinc-800/50 pb-10">
        <div className="text-center md:text-left">
          <h1 className="text-5xl font-black italic tracking-tighter">Hunter<span className={aura.text}>.</span>Tracker</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500 mt-2">Sincronizado como: {perfilAtivo.nome_exibicao}</p>
        </div>

        <div className="flex items-center gap-4 md:gap-6">

          {/* BOTÃO PUXAR DO ANILIST */}
          {perfilAtivo.anilist_token && (
            <button 
              onClick={puxarProgressoDoAniList}
              title={`Puxar ${abaPrincipal === "MANGA" ? "Mangás" : "Animes"} do AniList`}
              className={`w-14 h-14 bg-zinc-900 border border-blue-500/30 rounded-[1.2rem] flex items-center justify-center text-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/10 text-blue-500`}
            >
              🔄
            </button>
          )}

          {/* BOTÃO ADICIONAR OBRA */}
          <button 
            onClick={() => setEstaAbertoAdd(true)} 
            className={`${aura.bg} ${aura.shadow} px-8 py-4 rounded-2xl font-black uppercase text-xs hover:scale-105 active:scale-95 transition-all text-black`}
          >
            + Adicionar {abaPrincipal === "MANGA" ? "Mangá" : "Anime"}
          </button>

          {/* --- [AVATAR NO HEADER DA ESTANTE] --- */}
<div onClick={() => window.location.href = '/perfil'} className="group cursor-pointer flex flex-col items-center gap-2" title="Configurações do Hunter">
  <div className={`w-14 h-14 bg-zinc-900 rounded-[1.2rem] flex items-center justify-center overflow-hidden border-2 ${aura.border} group-hover:scale-110 transition-all shadow-lg`}>
    {perfilAtivo.avatar?.startsWith('http') ? (
      <img src={perfilAtivo.avatar} className="w-full h-full object-cover" alt="" />
    ) : (
      <span className="text-3xl">{perfilAtivo.avatar || "👤"}</span>
    )}
  </div>
  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter group-hover:text-white transition-colors">Configurações</span>
</div>
        </div>
      </header>

      {/* ✅ SELETOR DE ABAS GIGANTE (MANGÁS / ANIMES) */}
      <div className="flex gap-4 md:gap-8 mb-10 border-b border-zinc-800/50 pb-4">
        <button 
          onClick={() => { setAbaPrincipal("MANGA"); setFiltroAtivo("Lendo"); }} 
          className={`text-xl md:text-2xl font-black uppercase tracking-widest transition-all ${abaPrincipal === "MANGA" ? `${aura.text} drop-shadow-[0_0_15px_currentColor]` : "text-zinc-600 hover:text-white"}`}
     >
          📚 Estante de Mangás
     </button>
     <button 
       onClick={() => { setAbaPrincipal("ANIME"); setFiltroAtivo("Assistindo"); }} 
       className={`text-xl md:text-2xl font-black uppercase tracking-widest transition-all ${abaPrincipal === "ANIME" ? `${aura.text} drop-shadow-[0_0_15px_currentColor]` : "text-zinc-600 hover:text-white"}`}
    >
          📺 Estante de Animes
    </button>
  </div>

      {/* BARRA DE FILTROS E BUSCA */}
      {config.mostrar_busca && (
        <section className="mb-12 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex bg-zinc-900/50 p-1 rounded-2xl border border-zinc-800 w-full md:w-auto overflow-x-auto">
          {filtrosAtuais.map(f => (
            <button
              key={f}
              onClick={() => setFiltroAtivo(f)}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${filtroAtivo === f ? `${aura.bg} text-black` : 'text-zinc-500 hover:text-white'}`}
            >
              {f}
            </button>
   ))}
          </div>
          
          <input 
            type="text" 
            placeholder={`Pesquisar nos ${abaPrincipal === "MANGA" ? "Mangás" : "Animes"}...`}
            className="w-full md:w-80 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-xs font-bold uppercase outline-none focus:border-white transition-all"
            value={pesquisaInterna}
            onChange={(e) => setPesquisaInterna(e.target.value)}
          />
        </section>
      )}

      {/* GRADE DE OBRAS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
        {obrasFiltradas.length > 0 ? (
          obrasFiltradas.map(m => (
            <MangaCard 
              key={m.id} 
              manga={m} 
              aura={aura}
              abaPrincipal={abaPrincipal}
              atualizarCapitulo={atualizarCapitulo} 
              deletarManga={deletarMangaDaEstante} 
              mudarStatusManual={(id, s) => atualizarDados(id, {status: s})} 
              abrirDetalhes={(m) => setMangaDetalhe(m as Manga)} 
            />
          ))
        ) : (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-800 rounded-[3rem]">
            <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">Nenhuma obra encontrada nesta categoria.</p>
          </div>
        )}
      </div>

      {/* MODAIS (SALVAR NA ESTANTE E DETALHES) */}
      <AddMangaModal 
        estaAberto={estaAbertoAdd} 
        fechar={() => setEstaAbertoAdd(false)} 
        usuarioAtual={usuarioAtual} 
        abaPrincipal={abaPrincipal} // ✅ Enviamos para o Modal saber qual banco usar
        aoSalvar={() => {
          if (abaPrincipal === "MANGA") buscarMangas(); else buscarAnimes();
          setEstaAbertoAdd(false);
        }}
      />
      
      {mangaDetalhe && (
        <MangaDetailsModal 
          manga={mangaDetalhe} 
          abaPrincipal={abaPrincipal} // ✅ Enviamos para o Modal saber qual banco usar
          aoFechar={() => setMangaDetalhe(null)} 
          aoAtualizarCapitulo={atualizarCapitulo} 
          aoAtualizarDados={atualizarDados} 
          aoDeletar={(id) => { setMangaDetalhe(null); deletarMangaDaEstante(id); }} 
        />
      )}

      {/* PAINEL DE PERFIL DO USUÁRIO */}
      {mostrandoPerfil && (
        <UserProfile perfil={perfilAtivo} mangas={mangas} aoFechar={() => setMostrandoPerfil(false)} aoAtualizar={buscarPerfis} setUsuarioAtual={setUsuarioAtual} aura={aura} />
      )}
      
      {/* 🌟 NOTIFICAÇÃO FLUTUANTE (TOAST) */}
      <div className={`fixed bottom-10 right-10 z-[300] transition-all duration-500 transform ${toast.visivel ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl border backdrop-blur-md shadow-2xl ${toast.tipo === 'sucesso' ? 'bg-green-500/10 border-green-500/50 text-green-400 shadow-green-500/20' : 'bg-red-500/10 border-red-500/50 text-red-400 shadow-red-500/20'}`}>
          <div className="text-2xl animate-bounce">{toast.tipo === 'sucesso' ? '✅' : '❌'}</div>
          <span className="text-[10px] font-black uppercase tracking-widest mt-1">{toast.mensagem}</span>
        </div>
      </div>

    </main>
  );
}