import { NextResponse } from 'next/server';
import { MarkAsReadService } from '@/lib/MarkAsReadService';

const USER_ID_TEST = 1; 

// Marcar como leido test de service.

export async function POST(request: Request) {
    let bookId: string | undefined; 
    
    try {
        const body = await request.json();
        const { 
            bookId: receivedBookId, 
            rating, 
            review, 
            dateFinished 
        } = body; 
        
        bookId = receivedBookId; 

        if (!bookId || typeof bookId !== 'string') {
            return NextResponse.json({ error: "El campo 'bookId' es requerido y debe ser una cadena de texto." }, { status: 400 });
        }

        let finishedDate: Date | undefined = undefined;
        if (dateFinished && typeof dateFinished === 'string') {
            finishedDate = new Date(dateFinished);
        }

        const updatedEntry = await MarkAsReadService(
            bookId, 
            rating as number,
            review, 
            finishedDate, 
            USER_ID_TEST
        );
        
        return NextResponse.json({ 
            success: true, 
            message: "Libro marcado como LEÍDO y reseña/calificación guardada.", 
            entry: updatedEntry 
        });

    } catch (error) {
        console.error("Error en POST /api/markasread:", error);

        if (error instanceof Error && error.message.includes('Record to update not found')) {
            return NextResponse.json({ 
                success: false, 
                error: `Fallo al marcar como leído: El libro con ID ${bookId} no se encontró en tu lista.`, 
            }, { status: 404 });
        }

        return NextResponse.json({ 
            success: false, 
            error: "Fallo en la operación de marcado de lectura",
            details: error instanceof Error ? error.message : "Error desconocido"
        }, { status: 500 });
    }
}