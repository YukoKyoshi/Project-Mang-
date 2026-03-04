"use client";
import { useEffect, useState } from "react";

const CONFETE_CORES = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
const MATRIX_CHARS = ['0', '1', 'H', 'U', 'N', 'T', 'E', 'R'];

export default function EfeitosVisuais({ particula }: { particula: string }) {
  const [ativo, setAtivo] = useState(true);

  // Verifica se o usuário desligou os efeitos nas configurações
  useEffect(() => {
    const checkStatus = () => setAtivo(localStorage.getItem("hunter_animacoes") !== "false");
    checkStatus();
    window.addEventListener("hunter_animacoes_toggle", checkStatus);
    return () => window.removeEventListener("hunter_animacoes_toggle", checkStatus);
  }, []);

  if (!ativo || !particula) return null;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none w-screen h-screen">
      <style>{`
        @keyframes cairPetala { 0% { transform: translateY(-10vh) translateX(0) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(110vh) translateX(50px) rotate(720deg); opacity: 0; } }
        @keyframes cairNeve { 0% { transform: translateY(-10vh) translateX(0); opacity: 0; } 10% { opacity: 0.8; } 90% { opacity: 0.8; } 100% { transform: translateY(110vh) translateX(-30px); opacity: 0; } }
        @keyframes subirFogo { 0% { transform: translateY(110vh) scale(0.5); opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { transform: translateY(-10vh) scale(1.5); opacity: 0; } }
        @keyframes subirBolha { 0% { transform: translateY(110vh) scale(0.5); opacity: 0; } 50% { opacity: 0.6; transform: translateY(50vh) scale(1) translateX(15px); } 100% { transform: translateY(-10vh) scale(1.5) translateX(-15px); opacity: 0; } }
        @keyframes cairChuva { 0% { transform: translateY(-10vh) translateX(10px); opacity: 0; } 10% { opacity: 0.4; } 100% { transform: translateY(110vh) translateX(-10px); opacity: 0; } }
        @keyframes piscarEstrela { 0%, 100% { opacity: 0.1; transform: scale(0.5); } 50% { opacity: 1; transform: scale(1.2); box-shadow: 0 0 10px white; } }
        @keyframes cairMatrix { 0% { transform: translateY(-10vh); opacity: 0; text-shadow: 0 0 5px #22c55e; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(110vh); opacity: 0; } }
        @keyframes spinConfete { 0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; } 100% { transform: translateY(110vh) rotate(720deg); opacity: 0; } }
        @keyframes voarMorcego { 0% { transform: translate(110vw, 50vh) scale(0.5); opacity: 0;} 10% {opacity: 1;} 90% {opacity: 1;} 100% { transform: translate(-10vw, -50vh) scale(1.5); opacity: 0;} }

        .petala { position: absolute; background: linear-gradient(135deg, #fbcfe8 0%, #f472b6 100%); border-radius: 15px 0 15px 0; animation: cairPetala linear infinite; box-shadow: 0 0 10px rgba(244,114,182,0.5); }
        .neve { position: absolute; background: white; border-radius: 50%; animation: cairNeve linear infinite; box-shadow: 0 0 8px white; }
        .fogo { position: absolute; background: #f97316; border-radius: 50%; animation: subirFogo ease-in infinite; box-shadow: 0 0 15px #ea580c, 0 0 30px #f97316; }
        .bolha { position: absolute; border: 1px solid rgba(56,189,248,0.5); background: rgba(56,189,248,0.2); border-radius: 50%; animation: subirBolha ease-in infinite; }
        .chuva { position: absolute; background: linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 100%); width: 2px; height: 35px; animation: cairChuva linear infinite; }
        .estrela { position: absolute; background: white; border-radius: 50%; animation: piscarEstrela ease-in-out infinite; }
        .matrix { position: absolute; color: #22c55e; font-family: monospace; font-weight: bold; font-size: 16px; animation: cairMatrix linear infinite; }
        .confete { position: absolute; animation: spinConfete linear infinite; }
        .morcego { position: absolute; background: black; border-radius: 50% 50% 0 0; animation: voarMorcego linear infinite; box-shadow: 0 0 10px black; }
      `}</style>

      {particula === "particula_petalas" && Array.from({ length: 30 }).map((_, i) => <div key={i} className="petala" style={{ left: `${Math.random() * 100}%`, top: '-10%', width: `${8 + Math.random() * 12}px`, height: `${8 + Math.random() * 12}px`, animationDelay: `${Math.random() * 5}s`, animationDuration: `${4 + Math.random() * 5}s` }} />)}
      {particula === "particula_neve" && Array.from({ length: 50 }).map((_, i) => <div key={i} className="neve" style={{ left: `${Math.random() * 100}%`, top: '-10%', width: `${3 + Math.random() * 6}px`, height: `${3 + Math.random() * 6}px`, animationDelay: `${Math.random() * 5}s`, animationDuration: `${3 + Math.random() * 4}s` }} />)}
      {particula === "particula_fogo" && Array.from({ length: 40 }).map((_, i) => <div key={i} className="fogo" style={{ left: `${Math.random() * 100}%`, bottom: '-10%', width: `${4 + Math.random() * 6}px`, height: `${4 + Math.random() * 6}px`, animationDelay: `${Math.random() * 3}s`, animationDuration: `${2 + Math.random() * 3}s` }} />)}
      {particula === "particula_bolhas" && Array.from({ length: 25 }).map((_, i) => <div key={i} className="bolha" style={{ left: `${Math.random() * 100}%`, bottom: '-10%', width: `${10 + Math.random() * 20}px`, height: `${10 + Math.random() * 20}px`, animationDelay: `${Math.random() * 5}s`, animationDuration: `${4 + Math.random() * 4}s` }} />)}
      {particula === "particula_chuva" && Array.from({ length: 60 }).map((_, i) => <div key={i} className="chuva" style={{ left: `${Math.random() * 100}%`, top: '-10%', animationDelay: `${Math.random() * 2}s`, animationDuration: `${0.5 + Math.random() * 0.5}s` }} />)}
      {particula === "particula_estrelas" && Array.from({ length: 40 }).map((_, i) => <div key={i} className="estrela" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, width: `${2 + Math.random() * 4}px`, height: `${2 + Math.random() * 4}px`, animationDelay: `${Math.random() * 3}s`, animationDuration: `${1 + Math.random() * 3}s` }} />)}
      {particula === "particula_matrix" && Array.from({ length: 25 }).map((_, i) => <div key={i} className="matrix" style={{ left: `${Math.random() * 100}%`, top: '-10%', animationDelay: `${Math.random() * 5}s`, animationDuration: `${2 + Math.random() * 3}s` }}>{MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]}</div>)}
      {particula === "particula_confete" && Array.from({ length: 50 }).map((_, i) => <div key={i} className="confete" style={{ left: `${Math.random() * 100}%`, top: '-10%', width: '10px', height: '10px', backgroundColor: CONFETE_CORES[Math.floor(Math.random() * CONFETE_CORES.length)], animationDelay: `${Math.random() * 5}s`, animationDuration: `${3 + Math.random() * 4}s` }} />)}
      {particula === "particula_morcegos" && Array.from({ length: 6 }).map((_, i) => <div key={i} className="morcego" style={{ width: '20px', height: '10px', animationDelay: `${Math.random() * 10}s`, animationDuration: `${2 + Math.random() * 2}s` }} />)}
    </div>
  );
}