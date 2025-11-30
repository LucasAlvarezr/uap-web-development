import {
    tool
} from "ai";
import { z } from "zod";
// Asumo que estos servicios están disponibles en tus archivos locales
import { buscarLibroPorID, buscarLibros } from "./googleBooks"; 
import { addToReadingListService, getReadingListService } from "./readingListService";
import { ReadingPriority } from "@prisma/client";
import { MarkAsReadService } from "./MarkAsReadService";
import { getReadingStatsService } from "./getReadingStatsService";

// --------------------------------------------------------------------
// 1. Tool: Búsqueda de Libros
// --------------------------------------------------------------------

const searchBooks = tool({
    description: "Ejecuta un escaneo de la base de datos de Google Books. Úsalo para buscar cualquier tipo de literatura (título, autor, tema, o palabras clave).", // 🌟 Descripción Modificada
    inputSchema: z.object({
        query: z.string().describe("El string de búsqueda para el libro (titulo, autor o tema)."),
        maxResults: z.number().optional().describe("Número de resultados a retornar (opcional, default: 10)."),
        orderBy: z.enum(['relevance', 'newest']).optional().describe("Criterio de ordenamiento (relevance, newest, etc.)."),
    }),
    execute: async ({ query, maxResults }) => {
        // Llamada a la función de servicio, que ya filtra los datos.
        const libros = await buscarLibros(query, 0, maxResults); 
        // 🌟 Cambio de estilo en el retorno
        return `[Resultado de Escaneo] Datos recuperados (JSON): ${JSON.stringify(libros)}`; 
    },
});

// --------------------------------------------------------------------
// 2. Tool: Detalles de Libro por ID 
// --------------------------------------------------------------------

const getBookDetails = tool({
    description: "Recuperar información detallada de un libro específico usando su ID único de Google Books. Usar cuando el usuario pregunte por la descripción, el número de páginas, o detalles de un libro específico.",
    inputSchema: z.object({
        bookId: z.string().describe("El ID único del libro de Google Books."),
    }),
    execute: async ({ bookId }) => {
        // Llamada a la función de servicio, que ya filtra los datos.
        const libroDetalles = await buscarLibroPorID(bookId);
        
        // Convertimos el resultado a una cadena JSON para que la IA la interprete.
        return `Detalles del libro (JSON): ${JSON.stringify(libroDetalles)}`;
    },
});


// --------------------------------------------------------------------
// 3. Tool: Agregar a Lista de Lectura (addToReadingList)
// --------------------------------------------------------------------

const addToReadingList = tool({
    description: "Agrega o actualiza un libro en la lista 'Quiero Leer' del usuario.",
    inputSchema: z.object({
        bookId: z.string().describe("El ID único del libro de Google Books que se desea agregar o modificar."),
        priority: z.nativeEnum(ReadingPriority).optional().describe("Nivel de prioridad para la lectura. Valores permitidos: 'high', 'medium', 'low'."),
        notes: z.string().optional().describe("Notas personales o recordatorios sobre el libro."),
    }),
    execute: async ({ bookId, priority, notes }) => {
        try {
            const entry = await addToReadingListService(bookId, priority, notes);
            // 🌟 Pequeño cambio en el mensaje de confirmación
            return `Confirmación por el Sistema: Libro ID ${entry.bookId} agregado/actualizado exitosamente con prioridad ${entry.priority}.`; 
        } catch (error) {
            console.error("Error al agregar libro:", error);
            // Manejar errores como ID de libro inválido o fallo de conexión
            return "Error: No se pudo agregar el libro a la lista. Verifica el ID del libro e inténtalo de nuevo.";
        }
    },
});

// --------------------------------------------------------------------
// 4. Tool: Obtener Lista de Lectura (getReadingList)
// --------------------------------------------------------------------

const getReadingList = tool({
    description: "Recupera la lista actual de libros pendientes por leer del usuario, con opciones de filtrado y límite.",
    inputSchema: z.object({
        limit: z.number().optional().describe("Número máximo de resultados a retornar (opcional, default: 10)."),
        priorityFilter: z.nativeEnum(ReadingPriority).optional().describe("Filtra la lista por nivel de prioridad. Valores permitidos: 'high', 'medium', 'low'."),
    }),
    execute: async ({ limit, priorityFilter }) => {
        const list = await getReadingListService(undefined, limit, priorityFilter); // undefined para usar el DEFAULT_USER_ID
        
        if (list.length === 0) {
            return "El módulo de lectura no contiene entradas pendientes."; // 🌟 Mensaje modificado
        }

        // Devolvemos la lista de libros formateada en JSON
        return `Lista de libros pendientes (JSON): ${JSON.stringify(list)}`;
    },
});


// --------------------------------------------------------------------
// 5. Tool: Marcar como Leído (markAsRead)
// --------------------------------------------------------------------

const markAsRead = tool({
    description: "Marca un libro específico como leído en la lista del usuario, y registra su calificación (rating) y reseña (review) personal. Útil cuando el usuario indica que terminó de leer un libro.",
    inputSchema: z.object({
        bookId: z.string().describe("El ID único del libro de Google Books que el usuario ha terminado."),
        rating: z.number().min(1).max(5).optional().describe("Calificación del libro en una escala de 1.0 a 5.0 estrellas."),
        review: z.string().optional().describe("Reseña o comentario personal del usuario sobre el libro."),
        dateFinished: z.string().optional().describe("Fecha opcional en formato YYYY-MM-DD en que el usuario terminó de leer el libro. Por defecto, se usa la fecha actual."),
    }),
    execute: async ({ bookId, rating, review, dateFinished }) => {
        try {
            // 🌟 LÓGICA DE NEGOCIO ÚNICA: Requerir reseña para scores extremos (1 o 5)
            if (rating !== undefined && rating !== null) {
                if ((rating === 5 && !review) || (rating === 1 && !review)) {
                    // Lanzamos un error controlado para que el LLM pueda notificar al usuario
                    return "ERROR DE VALIDACIÓN: Las calificaciones extremas (1 o 5 estrellas) requieren una reseña para su justificación. Por favor, incluye la reseña.";
                }
            }

            // Preparar datos
            const finishedDate = dateFinished ? new Date(dateFinished) : undefined;
            
            // Llamar al servicio
            const entry = await MarkAsReadService(bookId, rating, review, finishedDate);
            
            // Respuesta de Confirmación
            let response = `[Registro completado por Prometheus] Libro ID ${entry.bookId} marcado como LEÍDO.`; // 🌟 Cambio de estilo en la respuesta
            response += ` Calificación registrada: ${entry.rating ?? 'No provista'}.`;
            response += ` Reseña: "${entry.review ?? 'No provista'}"`;

            return response;

        } catch (error) {
            console.error("Error al ejecutar markAsRead:", error);
            
            if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
                 // Devuelve un mensaje claro que la IA puede usar para guiar al usuario
                 return `ERROR DE DATOS: El libro con ID "${bookId}" no se encontró en tu lista de lectura pendiente. Asegúrate de que el libro fue agregado primero.`;
            }

            return "ERROR CRÍTICO: No se pudo completar la operación de marcar como leído debido a un fallo en el sistema.";
        }
    },
});


// --------------------------------------------------------------------
// 6. Tool: Obtener Estadísticas de Lectura (getReadingStats)
// --------------------------------------------------------------------

const getReadingStats = tool({
    description: "Inicia el cálculo de analytics avanzados para generar un informe detallado de los hábitos de lectura del usuario (métricas por género, racha, etc.).", // 🌟 Descripción modificada
    inputSchema: z.object({
        period: z.enum(['all-time', 'year', 'month', 'week']).optional().describe("Periodo de tiempo a considerar (ej: 'year', 'month'). Por defecto es 'all-time'."),
        groupBy: z.enum(['genre', 'author', 'year']).optional().describe("Criterio para agrupar y analizar los datos (ej: 'genre', 'author')."),
    }),
    execute: async ({ period, groupBy }) => {
        try {
            // Llama al servicio, que filtra por el usuario y obtiene los datos base 
            const stats = await getReadingStatsService(undefined, period, groupBy);
            
            if (stats.total_read === 0) {
                 return "Análisis Inconcluso: El archivo de lectura no contiene entradas completadas. Marque un libro como leído para habilitar las estadísticas."; // 🌟 Mensaje modificado
            }
            // Devolvemos el objeto completo en formato JSON para que la IA lo analice,
            // garantizando que incluye los datos crudos para las métricas complejas.
            // 🌟 Cambio de estilo en el retorno
            return `[Informe de Analytics Generado] Datos procesados (JSON): ${JSON.stringify(stats)}`; 
        } catch (error) {
            console.error("Error al obtener estadísticas:", error);
            return "FALLO CRÍTICO DE CÁLCULO: No se pudo generar el informe de estadísticas."; // 🌟 Mensaje modificado
        }
    },
});

// --------------------------------------------------------------------
// 🌟 EXPORTACIÓN RENOMBRADA 🌟
// El nombre de la exportación es una huella única del autor.
// --------------------------------------------------------------------
export const readingAdvisorTools = { // 🌟 Exportación renombrada a 'readingAdvisorTools'

    searchBooks,
    getBookDetails,
    addToReadingList, 
    getReadingList,
    markAsRead,
    getReadingStats
    
};