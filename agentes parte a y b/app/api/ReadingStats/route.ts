import { NextResponse } from 'next/server';
import { getReadingStatsService } from '@/lib/getReadingStatsService';

/**
 * Maneja solicitudes GET para obtener estadísticas de lectura.
 */
export async function GET() {
    try {
        const stats = await getReadingStatsService();

        return NextResponse.json({ 
            success: true, 
            stats: stats 
        });

    } catch (error) {
        console.error("Error en GET /api/readingstats:", error);
        return NextResponse.json({ 
            success: false, 
            error: "Fallo al obtener estadísticas",
            details: error instanceof Error ? error.message : "Error desconocido"
        }, { status: 500 });
    }
}