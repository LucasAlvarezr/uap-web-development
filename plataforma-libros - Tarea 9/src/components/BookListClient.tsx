// components/BookListClient.tsx
import Image from 'next/image';
import React from 'react';

// Define la interfaz de props
interface BookListProps {
    books: any[]; // Se usa 'any' para coincidir con la API de Google Books
    onSelectBook: (bookId: string) => void;
}

export default function BookList({ books, onSelectBook }: BookListProps) {
    if (books.length === 0) {
        return (
            <p className="text-center text-gray-500 italic mt-8">
                No se encontraron libros. Intenta una búsqueda diferente.
            </p>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
            {books.map((book: any) => {
                const volumeInfo = book.volumeInfo || {};
                const thumbnail = volumeInfo.imageLinks?.thumbnail || 'https://placehold.co/128x192?text=Sin+Imagen';
                
                return (
                    <div
                        key={book.id}
                        className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden cursor-pointer"
                        onClick={() => onSelectBook(book.id)}
                    >
                        <Image
                            src={thumbnail}
                            alt={`Portada de ${volumeInfo.title}`}
                            className="w-full h-auto object-cover rounded-t-xl"
                            width={128}
                            height={192}
                            priority
                        />
                        <div className="p-4">
                            <h3 className="font-bold text-lg mb-1 truncate">{volumeInfo.title || 'Título Desconocido'}</h3>
                            <p className="text-gray-600 text-sm">{volumeInfo.authors?.join(', ') || 'Autor Desconocido'}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}