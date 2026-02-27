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

// Definindo a interface Manga para o TypeScript não reclamar
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
  const [mangas, setMangas] = useState<Manga[]>([]);
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
  // --- Adicionando um pin administrativo --- //

  // ==========================================
  // 🔄 5. LÓGICA DE INICIALIZAÇÃO
  // ==========================================
  useEffect(() => { 
    // 1. Checa o Portão Mestre
    const mestre = sessionStorage.getItem("acesso_mestre");
    if (mestre === "true") setMestreAutorizado(true);

    // 2. Reset de segurança no F5
    sessionStorage.removeItem('hunter_ativo');
    setUsuarioAtual(null);
    
    // 3. [NOVO] Busca as configurações de visibilidade do Admin
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

async function buscarPerfis() {
  const { data } = await supabase.from("perfis").select("*");
  if (data) setPerfis(data);
}

async function atualizarCapitulo(manga: Manga, novo: number) {
  if (novo < 0) return;
  let novoStatus = manga.status;
  if (manga.total_capitulos > 0 && novo >= manga.total_capitulos) novoStatus = "Completos";
  else if (novo > 0 && (manga.status === "Planejo Ler" || manga.status === "Dropados")) novoStatus = "Lendo";
  
  await supabase.from("mangas").update({ 
    capitulo_atual: novo, 
    status: novoStatus, 
    ultima_leitura: new Date().toISOString() 
  }).eq("id", manga.id);
  
  buscarMangas();
}

async function atualizarDados(id: number, campos: any) {
  await supabase.from("mangas").update(campos).eq("id", id);
  setMangas(prev => prev.map(m => m.id === id ? { ...m, ...campos } : m));
  if (mangaDetalhe?.id === id) setMangaDetalhe(prev => prev ? { ...prev, ...campos } : null);
}

// --- criar perfis ---

async function salvarHunter() {
  if (!novoHunter.nome) return alert("O nome é obrigatório!");

  // ATENÇÃO: Separamos o nome_original para ele não ser reescrito na edição
  const dados: any = {
    nome_exibicao: novoHunter.nome,
    avatar: novoHunter.avatar,
    pin: novoHunter.pin,
    cor_tema: novoHunter.cor
  };

  let error;

  if (editandoNomeOriginal) {
    // MODO EDIÇÃO: Atualiza apenas as aparências, mantém a raiz intacta
    const result = await supabase.from("perfis")
      .update(dados)
      .eq("nome_original", editandoNomeOriginal);
    error = result.error;
  } else {
    // MODO CRIAÇÃO: Aqui sim, definimos o nome_original pela primeira vez
    dados.nome_original = novoHunter.nome;
    const result = await supabase.from("perfis").insert([dados]);
    error = result.error;
  }

  if (error) {
    alert("Erro: " + error.message);
  } else {
    fecharFormularioHunter();
    buscarPerfis();
  }
}

// Função auxiliar para limpar tudo ao fechar

function fecharFormularioHunter() {
  setMostrandoFormHunter(false);
  setEditandoNomeOriginal(null);
  setNovoHunter({ nome: '', avatar: '👤', pin: '', cor: 'verde' });
}

// Função para carregar dados no form

function prepararEdicao(perfil: any) {
  setNovoHunter({
    nome: perfil.nome_exibicao,
    avatar: perfil.avatar,
    pin: perfil.pin || '',
    cor: perfil.cor_tema
  });
  setEditandoNomeOriginal(perfil.nome_original);
  setMostrandoFormHunter(true);
}

// ---- atualizar configs do site ----//

async function atualizarConfig(chave: string, valor: boolean) {
  const novaConfig = { ...config, [chave]: valor };
  setConfig(novaConfig); // Atualiza visualmente na hora

  const { error } = await supabase
    .from("site_config")
    .update({ [chave]: valor })
    .eq("id", 1);

  if (error) alert("Erro ao salvar configuração: " + error.message);
}

// --- Deletar perfis ---//

async function deletarPerfil(perfil: any) {
  if (perfil.nome_original === "Admin") {
    alert("O perfil Administrador não pode ser removido.");
    return;
  }

  const confirmacao = confirm(`Tens a certeza que queres remover o Hunter "${perfil.nome_exibicao}"? Esta ação é permanente.`);
  
  if (confirmacao) {
    const { error } = await supabase
      .from("perfis")
      .delete()
      .eq("nome_original", perfil.nome_original);

    if (error) {
      alert("Erro ao remover: " + error.message);
    } else {
      alert("Hunter removido com sucesso.");
      buscarPerfis(); // Atualiza a lista no Admin e na tela inicial
    }
  }
}

  // ==========================================
  // 🔑 7. LÓGICA DE PERFIS E PIN
  // ==========================================
  function tentarMudarPerfil(nome: string) {
    if (nome === "Admin") {
      setIsAdmin(true); // Força o estado de Admin imediatamente
      setUsuarioAtual("Admin");
      return;
    }

    const info = perfis.find(p => p.nome_original === nome);
    if (info?.pin) {
      setPerfilAlvoParaBloqueio(nome);
      setPinDigitado("");
    } else {
      setIsAdmin(false); // Garante que não é admin
      setUsuarioAtual(nome);
    }
  }

  function confirmarPin() {
    const info = perfis.find(p => p.nome_original === perfilAlvoParaBloqueio);
    if (info && info.pin === pinDigitado) {
      setUsuarioAtual(perfilAlvoParaBloqueio);
      setPerfilAlvoParaBloqueio(null);
    } else {
      alert("PIN Incorreto!");
    }
  }

  // ==========================================
  // 🖥️ 8. RENDERING: ACESSO MESTRE
  // ==========================================
  if (!mestreAutorizado) return <AcessoMestre aoAutorizar={() => setMestreAutorizado(true)} />;
  if (carregando) return <div className="min-h-screen bg-[#040405] flex items-center justify-center text-zinc-500 font-bold uppercase">Carregando...</div>;

  // ------------------------------------------
  // SUB-SESSÃO 9.A: TELA DE SELEÇÃO INICIAL (COMPONENTIZADO)
  // ------------------------------------------
  if (!usuarioAtual) {
    return (
      <>
        <ProfileSelection 
          perfis={perfis}
          temas={TEMAS}
          tentarMudarPerfil={tentarMudarPerfil}
          perfilAlvoParaBloqueio={perfilAlvoParaBloqueio}
          pinDigitado={pinDigitado}
          setPinDigitado={setPinDigitado}
          confirmarPin={confirmarPin}
          setPinAdminAberto={setPinAdminAberto} // <--- Passamos o controle para o componente
          pinAdminAberto={pinAdminAberto}
        />

        {/* 🔐 O MODAL DO ADMIN FICA AQUI, NA TELA DE SELEÇÃO */}
        {pinAdminAberto && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/98 backdrop-blur-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-zinc-900 p-12 rounded-[3rem] border border-zinc-800 text-center space-y-8 shadow-[0_0_100px_rgba(0,0,0,1)] max-w-sm w-full">
              <h2 className="text-white font-black uppercase tracking-tighter text-2xl italic text-yellow-500">Admin Login</h2>
              <input 
                type="password" maxLength={4} autoFocus
                className="w-full bg-black border border-zinc-700 p-5 rounded-2xl text-center text-4xl font-bold text-white outline-none focus:border-yellow-500 transition-all font-mono"
                onChange={(e) => {
                   if (e.target.value === "5236") { // Lembre-se de colocar a sua senha
                     setIsAdmin(true);
                     setUsuarioAtual("Admin"); // <--- ESSA É A CHAVE MESTRA QUE FALTAVA
                     setPinAdminAberto(false);
                  }
                }}
              />
              <button 
                onClick={() => setPinAdminAberto(false)} 
                className="text-[10px] text-zinc-600 hover:text-white uppercase font-black tracking-widest mt-4"
              >
                Retornar
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // ------------------------------------------
  // SUB-SESSÃO 9.B: PAINEL DE CONTROLE (COMPONENTIZADO)
  // ------------------------------------------
  if (isAdmin) {
    return (
      <AdminPanel 
        perfis={perfis}
        config={config}
        mostrandoFormHunter={mostrandoFormHunter}
        setMostrandoFormHunter={setMostrandoFormHunter}
        novoHunter={novoHunter}
        setNovoHunter={setNovoHunter}
        deletarPerfil={deletarPerfil}
        setUsuarioAtual={setUsuarioAtual}
        atualizarConfig={atualizarConfig}
        salvarHunter={salvarHunter} 
        prepararEdicao={prepararEdicao}
        editandoNomeOriginal={editandoNomeOriginal}
        fecharFormularioHunter={fecharFormularioHunter}
      />
    );
  }

  // --- SUB-SESSÃO FINAL: ESTANTE DE MANGÁS (USUÁRIOS COMUNS) ---

  // ==========================================
  // 🖥️ 10. ESTANTE DE MANGÁS (INTERFACE DO USUÁRIO)
  // ==========================================
  
  // Pegamos os dados do Hunter logado para aplicar a Aura correta
  const perfilAtivo = perfis.find(p => p.nome_original === usuarioAtual) || { nome_exibicao: usuarioAtual, avatar: "👤", cor_tema: "verde" };
  const aura = perfilAtivo.cor_tema?.startsWith('#') ? TEMAS.custom : (TEMAS[perfilAtivo.cor_tema as keyof typeof TEMAS] || TEMAS.verde);
  
  // Filtramos os mangás com base no que o usuário clica ou digita
  const mangasFiltrados = mangas
    .filter(m => (filtroAtivo === "Todos" ? true : m.status === filtroAtivo))
    .filter(m => m.titulo.toLowerCase().includes(pesquisaInterna.toLowerCase()));

  return (
    <main className="min-h-screen bg-[#080808] p-6 md:p-12 text-white animate-in fade-in duration-700" style={perfilAtivo.cor_tema?.startsWith('#') ? { '--aura': perfilAtivo.cor_tema } as React.CSSProperties : {}}>
      
      {/* HEADER DA ESTANTE */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-16 border-b border-zinc-800/50 pb-10">
        <div className="text-center md:text-left">
          <h1 className="text-5xl font-black italic tracking-tighter">Hunter<span className={aura.text}>.</span>Tracker</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500 mt-2">Sincronizado como: {perfilAtivo.nome_exibicao}</p>
        </div>

        <div className="flex items-center gap-6">

          {/* BOTÃO ADICIONAR OBRA */}
          <button 
            onClick={() => setEstaAbertoAdd(true)} 
            className={`${aura.bg} ${aura.shadow} px-8 py-4 rounded-2xl font-black uppercase text-xs hover:scale-105 active:scale-95 transition-all text-black`}
          >
            + Adicionar Obra
          </button>

          {/* ACESSAR PERFIL (VOLTOU PARA O SEU LUGAR) */}
          <div 
            onClick={() => setMostrandoPerfil(true)} 
            className="group cursor-pointer flex flex-col items-center gap-2"
            title="Configurações do Hunter"
          >
            <div className={`w-14 h-14 bg-zinc-900 rounded-[1.2rem] flex items-center justify-center text-3xl border-2 ${aura.border} group-hover:scale-110 transition-all shadow-lg`}>
              {perfilAtivo.avatar}
            </div>
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter group-hover:text-white transition-colors">Configurações</span>
          </div>
        </div>
      </header>

      {/* BARRA DE FILTROS (DADOS / STATUS) */}
      {config.mostrar_busca && (
        <section className="mb-12 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex bg-zinc-900/50 p-1 rounded-2xl border border-zinc-800 w-full md:w-auto overflow-x-auto">
            {["Todos", "Lendo", "Completos", "Planejo Ler", "Dropados"].map(f => (
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
            placeholder="Pesquisar na estante..." 
            className="w-full md:w-80 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-xs font-bold uppercase outline-none focus:border-white transition-all"
            value={pesquisaInterna}
            onChange={(e) => setPesquisaInterna(e.target.value)}
          />
        </section>
      )}

      {/* GRADE DE MANGÁS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
        {mangasFiltrados.length > 0 ? (
          mangasFiltrados.map(m => (
            <MangaCard 
              key={m.id} 
              manga={m} 
              aura={aura}
              atualizarCapitulo={atualizarCapitulo} 
              deletarManga={(id) => { if(confirm("Remover esta obra da sua estante?")) supabase.from("mangas").delete().eq("id", id).then(buscarMangas) }} 
              mudarStatusManual={(id, s) => atualizarDados(id, {status: s})} 
              abrirDetalhes={(m) => setMangaDetalhe(m as Manga)} 
            />
          ))
        ) : (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-800 rounded-[3rem]">
            <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">Nenhum mangá encontrado nesta categoria.</p>
          </div>
        )}
      </div>

      {/* MODAIS (SALVAR NA ESTANTE E DETALHES) */}
      <AddMangaModal 
        estaAberto={estaAbertoAdd} 
        fechar={() => setEstaAbertoAdd(false)} 
        usuarioAtual={usuarioAtual} 
        aoSalvar={() => {
          buscarMangas(); // Atualiza a lista
          setEstaAbertoAdd(false); // Fecha o modal
          }}
      />
      
      {mangaDetalhe && (
        <MangaDetailsModal 
          manga={mangaDetalhe} 
          aoFechar={() => setMangaDetalhe(null)} 
          aoAtualizarCapitulo={atualizarCapitulo} 
          aoAtualizarDados={atualizarDados} 
          aoDeletar={(id) => { if(confirm("Excluir definitivamente?")) supabase.from("mangas").delete().eq("id", id).then(() => { setMangaDetalhe(null); buscarMangas(); }) }} 
        />
      )}

      {/* PAINEL DE PERFIL DO USUÁRIO (ESTATÍSTICAS E PIN) */}

      {mostrandoPerfil && (
        <UserProfile
          perfil={perfilAtivo}
          mangas={mangas}
          aoFechar={() => setMostrandoPerfil(false)}
          aoAtualizar={buscarPerfis}
          setUsuarioAtual={setUsuarioAtual}
          aura={aura} // <--- essa linha contem as cores
        />
      )}
      

    </main> // <--- Esta é a última tag </main> do seu page.tsx
  );
}