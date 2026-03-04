"use client";
import { useState, useEffect } from "react";
import { supabase } from "../supabase";

interface AdminPanelProps {
  perfis: any[];
  config: any;
  setUsuarioAtual: (v: string | null) => void;
  atualizarConfig: (k: string, v: boolean) => void;
  deletarPerfil: (p: any) => void;
}

export default function AdminPanel({ perfis, config, setUsuarioAtual, atualizarConfig, deletarPerfil }: AdminPanelProps) {
  const [abaAtiva, setAbaAtiva] = useState("GUILDA");
  const [localPerfis, setLocalPerfis] = useState<any[]>([]);
  const [usuarioEditando, setUsuarioEditando] = useState<any | null>(null);
  const [formEdit, setFormEdit] = useState({ nome_exibicao: "", avatar: "", pin: "", cor_tema: "", esmolas: 0 });
  const [carregandoAcao, setCarregandoAcao] = useState(false);

  // Sincroniza os perfis que vêm do banco
  useEffect(() => { setLocalPerfis(perfis); }, [perfis]);

  // ==========================================
  // 🛠️ FUNÇÕES DA GUILDA (GERENCIAMENTO)
  // ==========================================
  function abrirEdicao(perfil: any) {
    setUsuarioEditando(perfil);
    setFormEdit({
      nome_exibicao: perfil.nome_exibicao || perfil.nome_original,
      avatar: perfil.avatar || "👤",
      pin: perfil.pin || "",
      cor_tema: perfil.cor_tema || "azul",
      esmolas: perfil.esmolas || 0
    });
  }

  async function salvarEdicao() {
    if (!usuarioEditando) return;
    setCarregandoAcao(true);
    try {
      const { error } = await supabase.from("perfis").update({
        nome_exibicao: formEdit.nome_exibicao,
        avatar: formEdit.avatar,
        pin: formEdit.pin,
        cor_tema: formEdit.cor_tema,
        esmolas: formEdit.esmolas
      }).eq("nome_original", usuarioEditando.nome_original);
      
      if (error) throw error;
      
      // Atualiza a lista local na hora para não precisar recarregar a página
      setLocalPerfis(prev => prev.map(p => p.nome_original === usuarioEditando.nome_original ? { ...p, ...formEdit } : p));
      setUsuarioEditando(null);
      alert("✅ Caçador atualizado com sucesso!");
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setCarregandoAcao(false);
    }
  }

  async function criarNovoUsuario() {
    const nomeOriginal = prompt("Digite o Nome ÚNICO do novo usuário (usado para login):");
    if (!nomeOriginal) return;
    if (localPerfis.find(p => p.nome_original.toLowerCase() === nomeOriginal.toLowerCase())) {
      return alert("❌ Já existe um usuário com esse nome de login!");
    }

    setCarregandoAcao(true);
    try {
      const { data, error } = await supabase.from("perfis").insert([{ 
        nome_original: nomeOriginal, 
        nome_exibicao: nomeOriginal, 
        avatar: "👤", 
        cor_tema: "azul",
        esmolas: 0 
      }]).select().single();
      
      if (error) throw error;
      setLocalPerfis(prev => [...prev, data]);
      alert("🎉 Novo Caçador recrutado com sucesso!");
    } catch (err: any) {
      alert("Erro ao criar: " + err.message);
    } finally {
      setCarregandoAcao(false);
    }
  }

  // ==========================================
  // ⚡ FERRAMENTAS DIVINAS
  // ==========================================
  async function limparCachePesquisa() {
    if (!confirm("⚠️ Tem certeza? Isso vai apagar o histórico de buscas otimizadas pela IA. O sistema vai recriar o cache aos poucos.")) return;
    setCarregandoAcao(true);
    await supabase.from("search_cache").delete().neq("termo_original", "x"); // Apaga tudo
    alert("🧹 Cache de pesquisa purificado com sucesso!");
    setCarregandoAcao(false);
  }

  async function darEsmolasParaTodos() {
    const quantia = parseInt(prompt("Quantas Esmolas deseja dar para TODOS os usuários da guilda?") || "0");
    if (!quantia || quantia <= 0) return;
    
    if (!confirm(`Distribuir ${quantia} esmolas para cada caçador?`)) return;
    setCarregandoAcao(true);
    
    try {
      for (const p of localPerfis) {
        if (p.nome_original === "Admin") continue; // Admin não precisa de esmolas
        await supabase.from("perfis").update({ esmolas: (p.esmolas || 0) + quantia }).eq("nome_original", p.nome_original);
      }
      setLocalPerfis(prev => prev.map(p => p.nome_original === "Admin" ? p : { ...p, esmolas: (p.esmolas || 0) + quantia }));
      alert(`🌧️ Chuva de ${quantia} Esmolas realizada com sucesso!`);
    } catch (err) {
      alert("Erro durante a chuva de esmolas.");
    } finally {
      setCarregandoAcao(false);
    }
  }

  // ==========================================
  // 🖥️ RENDERIZAÇÃO DO PAINEL
  // ==========================================
  return (
    <main className="min-h-screen bg-[#040405] p-6 md:p-12 text-white font-sans relative overflow-x-hidden">
      
      {/* CABEÇALHO */}
      <header className="flex justify-between items-center mb-12 border-b border-yellow-500/20 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white italic tracking-tighter flex items-center gap-3">
            <span className="text-yellow-500">👑</span> Painel S+
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-yellow-500/60 mt-2">Controle Absoluto do Sistema</p>
        </div>
        <button onClick={() => { sessionStorage.removeItem("hunter_ativo"); setUsuarioAtual(null); }} className="px-6 py-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          Desconectar
        </button>
      </header>

      {/* ABAS DO PAINEL */}
      <div className="flex flex-wrap gap-4 mb-10">
        {["GUILDA", "SISTEMA", "FERRAMENTAS"].map(aba => (
          <button 
            key={aba} onClick={() => setAbaAtiva(aba)} 
            className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border ${abaAtiva === aba ? 'bg-yellow-500 text-black border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600'}`}
          >
            {aba === "GUILDA" ? "👥 A Guilda" : aba === "SISTEMA" ? "⚙️ Sistema" : "⚡ Ferramentas"}
          </button>
        ))}
      </div>

      {/* ==============================================
          ABA: GUILDA (GERENCIAMENTO DE USUÁRIOS)
      ================================================ */}
      {abaAtiva === "GUILDA" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-6">
            <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Caçadores Registrados ({localPerfis.length})</p>
            <button onClick={criarNovoUsuario} disabled={carregandoAcao} className="px-6 py-3 bg-green-500/10 border border-green-500/50 text-green-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-green-500 hover:text-black transition-all">
              + Recrutar Novo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {localPerfis.map(p => (
              <div key={p.id} className={`bg-zinc-900/40 p-6 rounded-3xl border flex flex-col gap-4 relative overflow-hidden transition-all hover:border-yellow-500/50 ${p.nome_original === "Admin" ? 'border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.05)]' : 'border-zinc-800'}`}>
                
                {p.nome_original === "Admin" && <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">Mestre</div>}

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-black rounded-2xl overflow-hidden border border-zinc-700 flex items-center justify-center text-2xl">
                    {p.avatar?.startsWith('http') ? <img src={p.avatar} className="w-full h-full object-cover" /> : p.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-white uppercase truncate">{p.nome_exibicao}</p>
                    <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Login: {p.nome_original}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-black/50 p-3 rounded-xl border border-white/5 mt-2">
                  <div className="text-center">
                    <p className="text-[8px] text-zinc-500 uppercase font-black">PIN</p>
                    <p className="text-xs font-bold text-white tracking-widest">{p.nome_original === "Admin" ? "🔒 .ENV" : (p.pin || "N/A")}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] text-yellow-500 uppercase font-black">Esmolas</p>
                    <p className="text-xs font-bold text-yellow-500">{p.esmolas || 0}</p>
                  </div>
                </div>

                {p.nome_original !== "Admin" && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => abrirEdicao(p)} className="flex-1 py-3 bg-zinc-800 text-zinc-300 rounded-xl text-[9px] font-black uppercase hover:bg-white hover:text-black transition-all">Editar Tudo</button>
                    <button onClick={() => deletarPerfil(p)} className="px-4 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[9px] font-black uppercase hover:bg-red-500 hover:text-white transition-all">X</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==============================================
          ABA: SISTEMA (CONFIGURAÇÕES GERAIS)
      ================================================ */}
      {abaAtiva === "SISTEMA" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-zinc-900/40 p-8 rounded-3xl border border-zinc-800 flex items-center justify-between">
            <div>
              <p className="font-black text-white uppercase text-sm">Barra de Pesquisa Global</p>
              <p className="text-[10px] text-zinc-500 uppercase mt-1">Permite que os usuários filtrem as obras na tela inicial.</p>
            </div>
            <button onClick={() => atualizarConfig("mostrar_busca", !config.mostrar_busca)} className={`w-16 h-8 rounded-full transition-all relative ${config.mostrar_busca ? 'bg-green-500' : 'bg-zinc-700'}`}>
              <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all ${config.mostrar_busca ? 'left-9' : 'left-1'}`} />
            </button>
          </div>
          <div className="bg-zinc-900/40 p-8 rounded-3xl border border-zinc-800 flex items-center justify-between">
            <div>
              <p className="font-black text-white uppercase text-sm">Botões de Backup</p>
              <p className="text-[10px] text-zinc-500 uppercase mt-1">Permite exportar e importar arquivos .json no perfil.</p>
            </div>
            <button onClick={() => atualizarConfig("mostrar_backup", !config.mostrar_backup)} className={`w-16 h-8 rounded-full transition-all relative ${config.mostrar_backup ? 'bg-green-500' : 'bg-zinc-700'}`}>
              <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all ${config.mostrar_backup ? 'left-9' : 'left-1'}`} />
            </button>
          </div>
        </div>
      )}

      {/* ==============================================
          ABA: FERRAMENTAS DIVINAS
      ================================================ */}
      {abaAtiva === "FERRAMENTAS" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-gradient-to-br from-zinc-900 to-black p-8 rounded-3xl border border-zinc-800 flex flex-col gap-4">
            <span className="text-4xl">🧹</span>
            <p className="font-black text-white uppercase text-sm">Purificar Cache</p>
            <p className="text-[10px] text-zinc-500 uppercase leading-relaxed mb-4">Apaga a memória da IA e força o sistema a buscar os títulos na internet novamente do zero. Útil se as capas estiverem vindo erradas.</p>
            <button onClick={limparCachePesquisa} disabled={carregandoAcao} className="mt-auto py-4 bg-zinc-800 hover:bg-red-500 hover:text-white text-zinc-400 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all">Executar Limpeza</button>
          </div>

          <div className="bg-gradient-to-br from-zinc-900 to-black p-8 rounded-3xl border border-yellow-500/20 flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <span className="text-4xl">🌧️</span>
            <p className="font-black text-yellow-500 uppercase text-sm drop-shadow-md">Chuva de Esmolas</p>
            <p className="text-[10px] text-zinc-500 uppercase leading-relaxed mb-4">Adiciona uma quantia exata de Esmolas de forma instantânea para todos os caçadores registrados no banco de dados.</p>
            <button onClick={darEsmolasParaTodos} disabled={carregandoAcao} className="mt-auto py-4 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500 hover:text-black font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(234,179,8,0.1)]">Iniciar Evento</button>
          </div>
        </div>
      )}

      {/* ==============================================
          MODAL: EDIÇÃO DIVINA DO USUÁRIO
      ================================================ */}
      {usuarioEditando && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#0e0e11] w-full max-w-lg p-8 rounded-[3rem] border border-zinc-800 shadow-2xl relative animate-in zoom-in-95">
            <button onClick={() => setUsuarioEditando(null)} className="absolute top-8 right-8 text-zinc-600 hover:text-white font-black text-xl">✕</button>
            
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Editor Divino</h2>
            <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest mb-8">Editando: {usuarioEditando.nome_original}</p>

            <div className="space-y-5">
              <div>
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nome de Exibição</label>
                <input type="text" className="w-full bg-black border border-white/5 p-4 rounded-xl text-white font-bold outline-none focus:border-yellow-500 transition-all mt-1" value={formEdit.nome_exibicao} onChange={e => setFormEdit({...formEdit, nome_exibicao: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Saldo de Esmolas</label>
                  <input type="number" className="w-full bg-black border border-yellow-500/30 p-4 rounded-xl text-yellow-500 font-black outline-none focus:border-yellow-500 transition-all mt-1" value={formEdit.esmolas} onChange={e => setFormEdit({...formEdit, esmolas: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Novo PIN (4 Dig)</label>
                  <input type="text" maxLength={4} className="w-full bg-black border border-white/5 p-4 rounded-xl text-white font-bold text-center tracking-[0.5em] outline-none focus:border-red-500 transition-all mt-1" value={formEdit.pin} onChange={e => setFormEdit({...formEdit, pin: e.target.value.replace(/\D/g, '')})} placeholder="0000" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Tema / Cor</label>
                  <select className="w-full bg-black border border-white/5 p-4 rounded-xl text-white text-[10px] font-bold uppercase outline-none mt-1" value={formEdit.cor_tema} onChange={e => setFormEdit({...formEdit, cor_tema: e.target.value})}>
                    <option value="azul">Azul</option> <option value="verde">Verde</option> <option value="roxo">Roxo</option> <option value="laranja">Laranja</option> <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Avatar Rápido</label>
                  <input type="text" className="w-full bg-black border border-white/5 p-4 rounded-xl text-white font-bold outline-none focus:border-white/20 transition-all mt-1" value={formEdit.avatar} onChange={e => setFormEdit({...formEdit, avatar: e.target.value})} placeholder="URL ou Emoji" />
                </div>
              </div>

              <button onClick={salvarEdicao} disabled={carregandoAcao} className="w-full py-5 mt-4 rounded-xl bg-yellow-500 text-black font-black uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                {carregandoAcao ? "Salvando..." : "Gravar Alterações no Banco"}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}