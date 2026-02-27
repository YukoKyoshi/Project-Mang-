# 📖 Dicionário do Tracker de Mangás

Este arquivo serve como mapa para entender onde cada peça do sistema vive e o que ela faz.

## 📂 Pastas Principais
- `src/app/`: O coração do site. É aqui que ficam as páginas.
- `src/app/components/`: Onde guardamos os "blocos de Lego" (pedaços visuais menores que montam as telas grandes).

## 📄 Páginas (Telas Inteiras)
- `page.tsx` (Raiz): É a **Estante Principal** e a **Tela Netflix**. Controla quem está logado, a busca, as abas (Lendo, Completos) e chama a grade de mangás.
- `perfil/page.tsx`: A **Página de Perfil**. Onde o usuário edita a Bio, Avatar, PIN, Cor/Aura, e vê suas estatísticas e troféus.

## 🧩 Componentes (Blocos de Lego)
- `MangaCard.tsx`: O "cartãozinho" individual de cada obra na estante (capa, título, botões de + e - capítulos).
- `MangaDetailsModal.tsx`: A janela preta gigante que abre quando clicamos numa obra para editar notas, sinopse e status.
- `AddMangaModal.tsx`: A janela de busca do AniList com o sistema do Google Translate embutido.

## 🧠 Estados Importantes (Memória do React)
- `usuarioAtual` / `usuarioAtivo`: Diz qual dos 3 perfis ("Meu Perfil", "Amigo 1", "Amigo 2") está com a tela aberta no momento.
- `sessionStorage`: Memória do navegador que tranca o perfil assim que a aba é fechada.
- `TEMAS` / `aura`: Dicionário de cores (Tailwind) que pinta os botões e bordas de acordo com a escolha do usuário.

## 🗄️ Banco de Dados (Supabase)
- **Tabela `mangas`:** Guarda as obras (titulo, nota, capitulos, status, usuario dono).
- **Tabela `perfis`:** Guarda as customizações (nome_exibicao, avatar, bio, pin, cor_tema).