import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

const DEFAULT_USER_ID = 1;

/**
 * Genera estadísticas clave de lectura para el usuario.
 * @param userId ID del usuario.
 * @param period Filtra estadísticas por periodo (periodo no implementado completamente en DB, pero se recibe).
 * @param groupBy Agrupa las estadísticas (agrupación no implementada completamente en DB, pero se recibe).
 * @returns Un objeto con el conteo de libros leídos y el rating promedio.
 */
export async function getReadingStatsService(
    userId: number = DEFAULT_USER_ID,
    period?: 'all-time' | 'year' | 'month' | 'week', // Para futuras implementaciones
    groupBy?: 'genre' | 'author' | 'year' // Para futuras implementaciones
) {
    // 1. Definir la cláusula WHERE (actualmente solo filtra por 'read' y 'userId')
    const whereClause: Prisma.ReadingEntryWhereInput = {
        userId: userId,
        status: 'read',
    };
        
    // 2. Conteo Total y Promedio
    const readCount = await prisma.readingEntry.count({ where: whereClause });

    const toReadCount = await prisma.readingEntry.count({ 
        where: { userId: userId, status: 'to_read' }
    });

    const ratingAggregate = await prisma.readingEntry.aggregate({
        _avg: { rating: true },
        where: { ...whereClause, rating: { not: null } },
    });
    
    // 3. Obtener datos para análisis avanzado (géneros, autores, racha)
    // Se recuperan todas las entradas LEÍDAS para que la IA (o una función externa) pueda hacer el 'groupBy'
    const detailedReadEntries = await prisma.readingEntry.findMany({
        where: whereClause,
        select: {
            bookId: true, 
            rating: true,
            dateFinished: true, 
        },
        orderBy: {
            dateFinished: 'desc',
        },
    });

    // 4. Devolver los resultados
    return {
        total_read: readCount,
        total_to_read: toReadCount,
        average_rating: ratingAggregate._avg.rating ? parseFloat(ratingAggregate._avg.rating.toFixed(2)) : 0,
        // Devolvemos las entradas detalladas para análisis externo (por la Tool/IA)
        detailed_entries_for_analysis: detailedReadEntries,
        period_requested: period || 'all-time',
        group_requested: groupBy || 'none',
    };
}