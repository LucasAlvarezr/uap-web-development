import { NextResponse } from 'next/server';
import { 
    addToReadingListService, 
    getReadingListService 
} from '@/lib/readingListService'; 
import { ReadingPriority } from '@prisma/client';

const USER_ID_TEST = 1; 

/**
 * Maneja solicitudes GET para recuperar la lista de lectura pendiente.
 * Prueba el servicio: getReadingListService
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = searchParams.get('limit');
        // El filtro de prioridad viene como string y lo casteamos al tipo de enum.
        const priority = searchParams.get('priority') as ReadingPriority | undefined;

        const list = await getReadingListService(
            USER_ID_TEST, 
            limit ? parseInt(limit, 10) : 10,
            priority
        );

        // Si la lista está vacía, devuelve un mensaje claro
        if (list.length === 0) {
             return NextResponse.json({ success: true, message: "La lista de lectura pendiente está vacía para el usuario." });
        }

        return NextResponse.json({ 
            success: true, 
            count: list.length, 
            list 
        });
    } catch (error) {
        console.error("Error en GET /api/readinglist:", error);
        return NextResponse.json({ 
            success: false, 
            error: "Fallo al obtener la lista de lectura", 
            details: error instanceof Error ? error.message : "Error desconocido"
        }, { status: 500 });
    }
}

/**
 * Maneja solicitudes POST para agregar/actualizar un libro a la lista.
 * Prueba el servicio: addToReadingListService
 * URL: /api/readinglist
 * BODY: { "bookId": "ID", "priority": "high", "notes": "..." }
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { bookId, priority, notes } = body;

        if (!bookId || typeof bookId !== 'string') {
            return NextResponse.json({ error: "El campo 'bookId' es requerido y debe ser una cadena de texto." }, { status: 400 });
        }

        const newEntry = await addToReadingListService(
            bookId, 
            priority as ReadingPriority, 
            notes, 
            USER_ID_TEST
        );

        return NextResponse.json({ 
            success: true, 
            message: "Libro agregado/actualizado exitosamente a la lista 'Quiero Leer'.", 
            entry: newEntry 
        });
    } catch (error) {
        console.error("Error en POST /api/ReadingList:", error);
        return NextResponse.json({ 
            success: false, 
            error: "Fallo al agregar el libro a la lista",
            details: error instanceof Error ? error.message : "Error desconocido"
        }, { status: 500 });
    }
}

