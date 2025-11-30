"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ChatMessage } from "@/app/api/chat/route";

export default function ToolsChatPage() {
  // ----------------------------
  //  Estado local
  // ----------------------------
  const [input, setInput] = useState("");

  // ----------------------------
  // Configuración de useChat
  // ----------------------------
  const { messages, sendMessage, status, error, stop } = useChat<ChatMessage>({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  // ----------------------------
  // Manejador de envío de mensajes
  // ----------------------------
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();         
    sendMessage({ text: input }); 
    setInput("");               
  };

  // ============================
  // 3️⃣ Renderizado del componente
  // ============================
  return (
    <div className="flex flex-col w-full py-8 stretch min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Overlay radial con efecto holográfico */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,255,0.05),transparent_70%)] pointer-events-none animate-pulse"></div>

      {/* Partículas flotantes sutiles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-cyan-400 rounded-full animate-bounce opacity-50"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-400 rounded-full animate-bounce opacity-50 delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-pink-400 rounded-full animate-bounce opacity-50 delay-500"></div>
      </div>

      <div className="relative z-10 flex flex-col flex-1 max-w-4xl mx-auto px-6">

        {/* ========================
            Header
        ======================== */}
        <div className="text-center mb-10">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-400/30">
              📖
            </div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 animate-pulse">
              DonChatGPT
            </h1>
          </div>
          <p className="text-slate-300 text-lg font-light italic">Master en: Asistencia de libros.</p>
        </div>

        {/* ========================
            Error Display
        ======================== */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/60 text-red-200 p-5 rounded-2xl mb-8 shadow-lg shadow-red-500/20 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-ping"></div>
              {error.message}
            </div>
          </div>
        )}

        {/* ========================
            Contenedor de mensajes con scroll 
        ======================== */}
        <div className="flex-1 space-y-8 mb-32 overflow-y-auto">
          {messages.map((message, index) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] p-5 rounded-3xl shadow-2xl backdrop-blur-md ${
                message.role === "user"
                  ? "bg-gradient-to-r from-cyan-600/80 to-purple-600/80 text-white border border-cyan-400/30"
                  : "bg-slate-800/60 border border-slate-600/50 text-slate-100"
              }`}>
                
                {/* Rol del mensaje con icono */}
                <div className="font-semibold text-sm mb-3 opacity-90 flex items-center gap-2">
                  {message.role === "user" ? (
                    <>
                      <div className="w-4 h-4 bg-cyan-400 rounded-full"></div>
                      Tú (Lector)
                    </>
                  ) : (
                    <>
                      <div className="w-4 h-4 bg-purple-400 rounded-full"></div>
                      DonChatGPT
                    </>
                  )}
                </div>

                {/* ========================
                     Renderizado de partes del mensaje
                ======================== */}
                {message.parts.map((part, index) => {
                  switch (part.type) {
                    case "text":
                      return (
                        <div key={`${message.id}-${index}`} className="whitespace-pre-wrap text-sm leading-relaxed">
                          {part.text}
                        </div>
                      );

                    case "tool-getWeather":
                      switch (part.state) {
                        case "input-streaming":
                          return (
                            <div key={`${message.id}-getWeather-${index}`} className="bg-slate-700/60 border border-slate-500/50 p-4 rounded-xl mt-3 backdrop-blur-sm">
                              <div className="text-xs text-cyan-300 flex items-center gap-2">
                                <div className="animate-pulse w-2 h-2 bg-cyan-400 rounded-full"></div>
                                🌤️ Recibiendo solicitud de clima...
                              </div>
                              <pre className="text-xs text-slate-300 mt-2 overflow-x-auto">
                                {JSON.stringify(part.input, null, 2)}
                              </pre>
                            </div>
                          );
                        case "input-available":
                          return (
                            <div key={`${message.id}-getWeather-${index}`} className="bg-slate-700/60 border border-slate-500/50 p-4 rounded-xl mt-3 backdrop-blur-sm">
                              <div className="text-xs text-cyan-300 flex items-center gap-2">
                                <div className="animate-spin w-3 h-3 border border-cyan-400 border-t-transparent rounded-full"></div>
                                🌤️ Obteniendo clima para {part.input.city}...
                              </div>
                            </div>
                          );
                        case "output-available":
                          return (
                            <div key={`${message.id}-getWeather-${index}`} className="bg-slate-700/60 border border-slate-500/50 p-4 rounded-xl mt-3 backdrop-blur-sm">
                              <div className="text-xs text-green-300 mb-2">🌤️ Datos del Clima</div>
                              <div className="text-sm text-slate-200">{part.output}</div>
                            </div>
                          );
                        case "output-error":
                          return (
                            <div key={`${message.id}-getWeather-${index}`} className="bg-red-900/30 border border-red-500/60 p-4 rounded-xl mt-3 backdrop-blur-sm">
                              <div className="text-xs text-red-300">Error: {part.errorText}</div>
                            </div>
                          );
                        default:
                          return null;
                      }

                    default:
                      return null;
                  }
                })}
              </div>
            </div>
          ))}

          {/* ========================
             Streaming
          ======================== */}
          {(status === "submitted" || status === "streaming") && (
            <div className="flex justify-start">
              <div className="bg-slate-800/60 border border-slate-600/50 p-5 rounded-3xl shadow-2xl backdrop-blur-md max-w-[85%]">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-400"></div>
                  <span className="text-slate-300 text-sm">DonChatGPT está pensando...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================
             Input Form
        ======================== */}
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 border-t border-slate-600/50 shadow-2xl backdrop-blur-md">
          <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto p-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1 relative">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Explora libros, pide recomendaciones, pregunta lo que quieras..."
                  className="w-full bg-slate-800/70 border border-slate-500/50 rounded-2xl p-5 pr-14 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300 backdrop-blur-sm shadow-inner"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 text-lg">📚</div>
              </div>

              {/* Botón dinámico según estado con estilo futurista */}
              {status === "submitted" || status === "streaming" ? (
                <button onClick={stop} className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-5 rounded-2xl font-semibold transition-all duration-300 shadow-lg shadow-red-500/30 backdrop-blur-sm">
                  Detener
                </button>
              ) : (
                <button type="submit" disabled={status !== "ready"} className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-8 py-5 rounded-2xl font-semibold transition-all duration-300 shadow-lg shadow-cyan-400/30 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm">
                  Enviar
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
