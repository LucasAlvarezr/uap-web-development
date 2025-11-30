import { prisma } from './prisma';
import { ReadingEntry } from '@prisma/client';

const DEFAULT_USER_ID = 1;

/**
 * Marca un libro específico como 'read', actualizando el rating, review y fecha de finalización.
 */
export async function MarkAsReadService(
    bookId: string,
    rating?: number, 
    review?: string,
    dateFinished?: Date,
    userId: number = DEFAULT_USER_ID 
): Promise<ReadingEntry> {
    
    
    const entry = await prisma.readingEntry.update({
        where: {
            
            userId_bookId: { 
                userId: userId,
                bookId: bookId,
            },
        },
        data: {
            status: 'read', 
            rating: rating, 
            review: review,
            dateFinished: dateFinished || new Date(), 
        },
    });

    return entry;
}