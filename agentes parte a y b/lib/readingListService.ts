import { prisma } from './prisma';
import { ReadingPriority, ReadingEntry, Prisma } from '@prisma/client';

const DEFAULT_USER_ID = 1;

// Selección simplificada usada por getReadingList
const getReadingListQuery = {
    select: {
        bookId: true,
        priority: true,
        notes: true,
        dateAdded: true,
    }
} as const;

type SimplifiedReadingEntry = Prisma.ReadingEntryGetPayload<typeof getReadingListQuery>;

// Servicio: Agregar a Lista
export async function addToReadingListService(
    bookId: string,
    priority: ReadingPriority = ReadingPriority.medium,
    notes?: string,
    userId: number = DEFAULT_USER_ID
): Promise<ReadingEntry> {

    const entry = await prisma.readingEntry.upsert({
        where: {
            userId_bookId: {
                userId: userId,
                bookId: bookId,
            },
        },
        update: {
            status: 'to_read',
            priority: priority,
            notes: notes,
            dateAdded: new Date(),
            dateFinished: null,
        },
        create: {
            userId: userId,
            bookId: bookId,
            status: 'to_read',
            priority: priority,
            notes: notes,
        },
    });

    return entry;
}

// Servicio: Obtener Lista
export async function getReadingListService(
    userId: number = DEFAULT_USER_ID,
    limit: number = 10,
    priorityFilter?: ReadingPriority
): Promise<SimplifiedReadingEntry[]> {

    const whereClause: Prisma.ReadingEntryWhereInput = {
        userId: userId,
        status: 'to_read',
    };

    if (priorityFilter) {
        whereClause.priority = priorityFilter;
    }

    const entries = await prisma.readingEntry.findMany({
        where: whereClause,
        take: limit,
        orderBy: {
            dateAdded: 'desc',
        },
        ...getReadingListQuery
    });

    return entries as SimplifiedReadingEntry[];
}
