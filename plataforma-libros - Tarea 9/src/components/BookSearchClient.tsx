// src/components/BookSearchClient.tsx
"use client";
import { useState, useEffect } from 'react';

// Importaciones de Firebase (solo lo necesario para el cliente)
import { initializeApp, getApps, getApp } from 'firebase/app'; // Añadidos getApps, getApp
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { Firestore, getFirestore, collection, query, onSnapshot } from 'firebase/firestore';

// Importaciones de Next.js/UI
import { Book, ChevronRight, X } from 'lucide-react';
import BookList from './BookListClient'; 
import BookDetails from './BookDetailsClient';

// Define la interfaz de Reseña
interface Review {
    id: string;
    bookId: string;
    user: string;
    rating: number;
    text: string;
    upvotes: number;
    downvotes: number;
    timestamp: Date;
}

export default function BookSearchClient() {
    const [searchQuery, setSearchQuery] = useState('');
    const [books, setBooks] = useState<any[]>([]);
    const [selectedBook, setSelectedBook] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    
    // Lógica de Firebase
    const [userId, setUserId] = useState<string | null>(null);
    const [db, setDb] = useState<Firestore | null>(null);
    const [isFirebaseReady, setIsFirebaseReady] = useState(false);

    // Mueve aquí toda la lógica de inicialización y autenticación de Firebase
    useEffect(() => {
        try {
            // 🚨 Reemplaza estos valores con tus credenciales
            const firebaseConfig = {
                apiKey: "AIzaSyCrp2k7MHO-uSTPjlj2gYa4FlbiKfArJhs",
                authDomain: "mi-app-de-libros.firebaseapp.com",
                projectId: "mi-app-de-libros",
                storageBucket: "mi-app-de-libros.firebasestorage.app",
                messagingSenderId: "600165731592",
                appId: "1:600165731592:web:952865b9f2e6468d39b0bd"
            };

            // 🛠️ CORRECCIÓN: Evitar la doble inicialización
            let app;
            if (getApps().length === 0) {
                app = initializeApp(firebaseConfig);
            } else {
                app = getApp(); // Obtiene la app ya inicializada
            }

            const auth = getAuth(app);
            const firestore = getFirestore(app);
            setDb(firestore);

            onAuthStateChanged(auth, (user: User | null) => {
                if (user) {
                    setUserId(user.uid);
                } else {
                    signInAnonymously(auth).then((userCredential) => {
                        setUserId(userCredential.user.uid);
                    }).catch((err) => {
                        console.error("Error signing in anonymously:", err);
                        setError("Error de autenticación anónima.");
                    });
                }
                setIsFirebaseReady(true);
            });
        } catch (e) {
            console.error("Error initializing Firebase:", e);
            setError("Error al inicializar la base de datos.");
        }
    }, []);

    // Escuchar reseñas en tiempo real (solo cuando hay un libro seleccionado)
    useEffect(() => {
        if (isFirebaseReady && db && selectedBook) {
            // Utilizamos el mismo onSnapshot que tenías para el REAL-TIME
            const q = query(collection(db, "reviews"));
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const bookReviews: Review[] = [];
                querySnapshot.forEach((doc) => {
                    const reviewData = doc.data();
                    if (reviewData.bookId === selectedBook.id) {
                        bookReviews.push({ 
                            id: doc.id,
                            bookId: reviewData.bookId,
                            user: reviewData.user,
                            rating: reviewData.rating,
                            text: reviewData.text,
                            upvotes: reviewData.upvotes,
                            downvotes: reviewData.downvotes,
                            timestamp: reviewData.timestamp.toDate()
                        });
                    }
                });
                bookReviews.sort((a, b) => b.upvotes - a.upvotes);
                setReviews(bookReviews);
            }, (err) => {
                console.error("Error fetching reviews:", err);
                setError("Error al cargar las reseñas.");
            });
            return () => unsubscribe();
        }
    }, [db, selectedBook, isFirebaseReady]);

    // Función de Búsqueda (Google Books API) - Mantenida en el Cliente
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            setError('Por favor, ingresa un título, autor o ISBN.');
            setBooks([]);
            return;
        }

        setIsLoading(true);
        setError(null);
        setSelectedBook(null);

        const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('No se pudieron obtener los datos de la API.');
            }
            const data = await response.json();
            setBooks(data.items || []);
        } catch (err) {
            setError('Error al buscar libros. Por favor, inténtalo de nuevo más tarde.');
        } finally {
            setIsLoading(false);
        }
    };

    // Función para manejar la selección de un libro y obtener sus detalles
    const handleSelectBook = async (bookId: string) => {
        setIsLoading(true);
        setError(null);
        const apiUrl = `https://www.googleapis.com/books/v1/volumes/${bookId}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('No se pudieron obtener los detalles del libro.');
            }
            const data = await response.json();
            setSelectedBook(data);
        } catch (err) {
            setError('Error al cargar los detalles del libro.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full">
            {/* Formulario de búsqueda (solo visible si no hay un libro seleccionado) */}
            {!selectedBook && (
                <form onSubmit={handleSearch} className="w-full max-w-2xl mb-8 mx-auto">
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar por título, autor o ISBN..."
                            className="w-full p-4 pl-12 pr-4 text-lg border-2 border-indigo-200 rounded-full focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-shadow"
                        />
                        <button
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-2.5 rounded-full hover:bg-indigo-700 transition-colors"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </form>
            )}

            {/* Muestra el ID del usuario para fines de depuración */}
            <p className="text-xs text-gray-400 mb-4 text-center">
                {userId ? `ID de Usuario: ${userId}` : 'Cargando usuario...'}
            </p>

            {/* Indicadores de estado (carga/error) */}
            {isLoading && (
                <div className="text-center text-indigo-600 mt-12"><p className="text-xl">Cargando...</p></div>
            )}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative max-w-2xl w-full mt-4 mx-auto" role="alert">
                    <strong className="font-bold">Error:</strong>
                    <span className="block sm:inline ml-2">{error}</span>
                </div>
            )}

            {/* Contenido principal: Detalles o Lista */}
            {!isLoading && !error && (
                selectedBook ? (
                    <BookDetails 
                        selectedBook={selectedBook} 
                        reviews={reviews} 
                        setSelectedBook={setSelectedBook}
                        userId={userId}
                    />
                ) : (
                    <BookList books={books} onSelectBook={handleSelectBook} />
                )
            )}
        </div>
    );
}