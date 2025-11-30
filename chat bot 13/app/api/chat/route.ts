import { NextRequest } from "next/server";
import { streamText, generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export const runtime = "edge";

const OPENROUTER_BASE =
  process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
const MODEL =
  process.env.OPENROUTER_MODEL ?? "mistralai/mistral-small";


function jsonError(msg: string, status = 500) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { "content-type": "application/json" },
  });
}


function buildPrompt(raw: Array<{ role: string; content: string }>) {
  const lines: string[] = [
    "Sistema: Eres un asistente útil y amable. Responde claro y breve.",
  ];
  for (const m of raw) {
    const role =
      m.role === "user" ? "Usuario" : m.role === "assistant" ? "Asistente" : "Sistema";
    lines.push(`${role}: ${String(m.content ?? "").trim()}`);
  }
  lines.push("Asistente:");
  return lines.join("\n");
}


export async function GET() {
  return new Response(
    JSON.stringify({
      ok: true,
      endpoint: "/api/chat",
      usage: "POST con { messages: [{role:'user', content:'...'}] }",
      tip: "Agrega ?stream=false para no-streaming; sin query usa streaming.",
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return jsonError("Falta OPENROUTER_API_KEY en .env.local", 500);

  try {
    const url = new URL(req.url);
    const streamParam = url.searchParams.get("stream");
    const shouldStream = streamParam !== "false"; 

    const body = await req.json().catch(() => ({}));
    const msgs = Array.isArray(body?.messages) ? body.messages : [];
    if (!msgs.length) return jsonError("Faltan messages", 400);

    const openrouter = createOpenAI({
      baseURL: OPENROUTER_BASE,
      apiKey,
      headers: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Ejercicio 13 Chatbot",
      },
    });

    const prompt = buildPrompt(
      msgs.map((m: any) => ({ role: String(m.role), content: String(m.content ?? "") }))
    );

    if (!shouldStream) {
      const result = await generateText({
        model: openrouter(MODEL),
        prompt,
        temperature: 0.7,
      });

      return new Response(JSON.stringify({ text: result.text }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }


    const result = await streamText({
      model: openrouter(MODEL),
      prompt,
      temperature: 0.7,
      onError: (err) => console.error("OpenRouter stream error:", err),
    });

    return result.toTextStreamResponse({
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  } catch (err: any) {
    const msg = String(err?.message || err);
    console.error("POST /api/chat error:", msg);
    return jsonError(msg, 500);
  }
}
