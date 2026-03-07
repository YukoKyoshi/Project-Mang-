"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/supabase";
import EfeitosVisuais from "./EfeitosVisuais";

export default function GlobalVFXManager() {
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [particulaId, setParticulaId] = useState<string>("");

  const carregarCosmeticosGlobais = async () => {
    const hunterAtivo = sessionStorage.getItem("hunter_ativo");
    
    if (!hunterAtivo) {
      setBackgroundUrl(null);
      setParticulaId("");
      return;
    }

    const { data: perfil } = await supabase
      .from("perfis")
      .select("cosmeticos")
      .eq("nome_original", hunterAtivo)
      .single();

    if (perfil?.cosmeticos?.ativos) {
      const ativos = perfil.cosmeticos.ativos;
      
      // ✅ Slot 1: Partículas (Repassa para o EfeitosVisuais)
      setParticulaId(ativos.particula || "");

      // ✅ Slot 2: VFX (Background Imersivo)
      if (ativos.vfx) {
        const { data: item } = await supabase
          .from("loja_itens")
          .select("imagem_url")
          .eq("id", ativos.vfx)
          .single();
        
        if (item?.imagem_url) {
          const urlBase = item.imagem_url.split('?')[0].toLowerCase();
          if (urlBase.endsWith('.mp4') || urlBase.endsWith('.webm') || urlBase.endsWith('.gif')) {
            setBackgroundUrl(item.imagem_url);
          } else {
            setBackgroundUrl(null);
          }
        }
      } else {
        setBackgroundUrl(null);
      }
    }
  };

  useEffect(() => {
    carregarCosmeticosGlobais();
    window.addEventListener("hunter_cosmeticos_update", carregarCosmeticosGlobais);
    return () => window.removeEventListener("hunter_cosmeticos_update", carregarCosmeticosGlobais);
  }, []);

  return (
    <>
      {/* 🎬 CAMADA DE BACKGROUND (VFX) - CALIBRADA PARA CLARIDADE */}
      {backgroundUrl && (
        <div className="fixed inset-0 z-[-2] pointer-events-none overflow-hidden">
          {backgroundUrl.split('?')[0].toLowerCase().endsWith('.gif') ? (
            <img 
              src={backgroundUrl} 
              className="w-full h-full object-cover opacity-70" // ✅ Aumentado para dar mais brilho ao GIF
              alt="Background VFX" 
            />
          ) : (
            <video 
              key={backgroundUrl} 
              autoPlay 
              loop 
              muted 
              playsInline 
              preload="auto"
              crossOrigin="anonymous"
              className="w-full h-full object-cover opacity-50 mix-blend-screen" // ✅ Opacidade do vídeo equilibrada
            >
              <source src={backgroundUrl} type={backgroundUrl.includes('.webm') ? 'video/webm' : 'video/mp4'} />
            </video>
          )}
          
          {/* ✅ FILTRO DE PROFUNDIDADE REVISADO: Mais claro e com desfoque sutil */}
          <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" />
        </div>
      )}

      {/* ❄️ CAMADA DE PRIMEIRO PLANO (PARTÍCULAS CSS) */}
      <EfeitosVisuais particula={particulaId} />
    </>
  );
}