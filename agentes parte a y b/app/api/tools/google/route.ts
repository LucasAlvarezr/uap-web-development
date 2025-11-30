import { NextResponse } from "next/server";
import { buscarLibros, buscarLibroPorID } from "@/lib/googleBooks";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, id, startIndex = 0, maxResults = 10 } = body;

    if (id) {
      // Obtener libro por ID
      const libro = await buscarLibroPorID(id);
      return NextResponse.json(libro);
    } else if (query) {
      // Buscar libros por palabra clave
      const libros = await buscarLibros(query, startIndex, maxResults);
      return NextResponse.json(libros);
    } else {
      return NextResponse.json({ error: "Debes enviar 'query' o 'id' en el body" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error en /api/google:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}
