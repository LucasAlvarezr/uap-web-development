// app/page.tsx
import { Book } from 'lucide-react';
import BookSearchClient from '@/components/BookSearchClient'; // Importamos el componente de cliente

// Este componente es un Server Component por defecto
export default function Home() {
    return (
        <div className="bg-gray-100 min-h-screen font-sans antialiased text-gray-900 flex flex-col items-center p-4 sm:p-6 md:p-8">
            {/* Encabezado (Puro HTML, estático, perfecto para el Servidor) */}
            <header className="w-full max-w-4xl text-center mb-8">
                <h1 className="text-4xl font-extrabold text-indigo-700 mb-2">
                    <Book size={48} className="inline-block mr-2 align-middle" />
                    Mi Biblioteca de Reseñas
                </h1>
                <p className="text-lg text-gray-600">Encuentra y comparte reseñas de tus libros favoritos</p>
            </header>

            {/* Contenido principal (Delegado al Client Component) */}
            <BookSearchClient />
        </div>
    );
}

// ⚠️ Nota: Hemos simplificado el page.tsx eliminando el fetching inicial de reseñas del servidor 
// para priorizar la separación y dejar el real-time en el cliente.
// Si el requisito es que la LISTA INICIAL sea Server-Side, tendrías que modificar esto.