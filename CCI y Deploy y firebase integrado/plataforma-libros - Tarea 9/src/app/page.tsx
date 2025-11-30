"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image'; // Importa el componente Image de Next.js
import { Book, Star, ThumbsUp, ThumbsDown, ChevronRight, X } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { Firestore, getFirestore, collection, query, addDoc, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';

// Define la interfaz para los datos de reseña para evitar el error 'any'
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

// Componente principal de la aplicación de reseñas de libros
export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState<any | null>(null); // Se deja 'any' aquí si la estructura del libro es variable
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]); // Usa la interfaz Review
  const [userId, setUserId] = useState<string | null>(null);
  const [db, setDb] = useState<Firestore | null>(null);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  // Inicialización de Firebase
  useEffect(() => {
    try {
      const firebaseConfig = {
        apiKey: "AIzaSyCrp2k7MHO-uSTPjlj2gYa4FlbiKfArJhs",
        authDomain: "mi-app-de-libros.firebaseapp.com",
        projectId: "mi-app-de-libros",
        storageBucket: "mi-app-de-libros.firebasestorage.app",
        messagingSenderId: "600165731592",
        appId: "1:600165731592:web:952865b9f2e6468d39b0bd"
      };

      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const firestore = getFirestore(app);
      setDb(firestore);

      onAuthStateChanged(auth, (user) => {
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
      if (e instanceof Error) {
        setError("Error al inicializar la base de datos: " + e.message);
      } else {
        setError("Error al inicializar la base de datos.");
      }
    }
  }, []);

  // Escuchar reseñas en tiempo real
  useEffect(() => {
    if (isFirebaseReady && db && selectedBook) {
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

  // Función para manejar la búsqueda de libros
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
      console.error(err);
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
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para agregar una nueva reseña
  const handleAddReview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !userId) {
      setError("La base de datos no está lista. Inténtalo de nuevo.");
      return;
    }

    const form = e.target as HTMLFormElement;
    const newReviewText = (form.reviewText as HTMLTextAreaElement).value;
    const newRating = parseInt((form.rating as HTMLSelectElement).value, 10);
    
    if (newReviewText.trim() && selectedBook) {
      try {
        const reviewRef = collection(db, `reviews`);
        await addDoc(reviewRef, {
          bookId: selectedBook.id,
          user: userId,
          rating: newRating,
          text: newReviewText,
          upvotes: 0,
          downvotes: 0,
          timestamp: new Date(),
        });
        form.reset(); // Limpiar el formulario
      } catch (e) {
        console.error("Error adding document: ", e);
        setError("Error al enviar la reseña.");
      }
    }
  };

  // Función para votar en una reseña
  const handleVote = async (reviewId: string, type: 'upvote' | 'downvote') => {
    if (!db) {
      setError("La base de datos no está lista.");
      return;
    }
    const reviewRef = doc(db, `reviews/${reviewId}`);
    try {
      const reviewSnap = await getDoc(reviewRef);
      if (reviewSnap.exists()) {
        const reviewData = reviewSnap.data();
        if (type === 'upvote') {
          await updateDoc(reviewRef, { upvotes: reviewData.upvotes + 1 });
        } else if (type === 'downvote') {
          await updateDoc(reviewRef, { downvotes: reviewData.downvotes + 1 });
        }
      }
    } catch (e) {
      console.error("Error updating vote:", e);
      setError("Error al votar en la reseña.");
    }
  };

  // Componente para la visualización de la lista de libros
  const BookList = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
      {books.map((book: any) => {
        const volumeInfo = book.volumeInfo || {};
        const thumbnail = volumeInfo.imageLinks?.thumbnail || 'https://placehold.co/128x192?text=Sin+Imagen';
        return (
          <div
            key={book.id}
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden cursor-pointer"
            onClick={() => handleSelectBook(book.id)}
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

  // Componente para el detalle del libro y las reseñas
  const BookDetails = () => {
    const volumeInfo = selectedBook?.volumeInfo || {};
    const bookReviews = reviews.filter(review => review.bookId === selectedBook?.id);
    const thumbnail = volumeInfo.imageLinks?.thumbnail || 'https://placehold.co/128x192?text=Sin+Imagen';

    // Calcular la distribución de calificaciones para el gráfico
    const ratingCounts = [0, 0, 0, 0, 0];
    bookReviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        ratingCounts[review.rating - 1]++;
      }
    });

    const ratingData = ratingCounts.map((count, index) => ({
      name: `${index + 1}★`,
      reseñas: count,
    }));

    return (
      <div className="bg-white rounded-xl shadow-xl p-6 md:p-8 space-y-8 max-w-4xl mx-auto my-6">
        <button
          onClick={() => setSelectedBook(null)}
          className="absolute top-4 left-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <X size={24} className="text-gray-600" />
        </button>
        <div className="flex flex-col md:flex-row items-start md:space-x-8">
          <Image
            src={thumbnail}
            alt={`Portada de ${volumeInfo.title}`}
            className="w-48 h-auto object-cover rounded-lg shadow-md flex-shrink-0"
            width={192}
            height={288}
            priority
          />
          <div className="mt-4 md:mt-0">
            <h2 className="text-3xl font-bold mb-2">{volumeInfo.title || 'Título Desconocido'}</h2>
            <p className="text-xl text-gray-700 font-medium mb-2">{volumeInfo.authors?.join(', ') || 'Autor Desconocido'}</p>
            <p className="text-sm text-gray-500 mb-4">
              {volumeInfo.publishedDate ? `Publicado: ${volumeInfo.publishedDate}` : ''}
            </p>
            <p className="text-gray-800 leading-relaxed max-h-48 overflow-y-auto pr-2">
              {volumeInfo.description || 'No hay descripción disponible para este libro.'}
            </p>
          </div>
        </div>

        {/* Sección de Reseñas */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold border-b pb-2">Reseñas y Calificaciones</h3>

          {/* Gráfico de distribución de calificaciones */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-lg font-semibold mb-2">Distribución de Calificaciones</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ratingData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="reseñas" fill="#6366f1" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Formulario para escribir una nueva reseña */}
          <form onSubmit={handleAddReview} className="p-4 bg-gray-50 rounded-lg shadow-inner">
            <h4 className="text-lg font-semibold mb-4">Escribe tu Reseña</h4>
            <div className="mb-4">
              <label htmlFor="rating" className="block text-gray-700 font-medium mb-2">Calificación (1-5 estrellas):</label>
              <select name="rating" id="rating" className="w-full p-2 border border-gray-300 rounded-md">
                {[1, 2, 3, 4, 5].map(star => (
                  <option key={star} value={star}>{star} {star === 1 ? 'estrella' : 'estrellas'}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="reviewText" className="block text-gray-700 font-medium mb-2">Tu Reseña:</label>
              <textarea
                id="reviewText"
                name="reviewText"
                rows="4"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Comparte tu opinión sobre el libro..."
                required
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={!isFirebaseReady}
              className={`w-full font-bold py-2 px-4 rounded-md transition-colors ${!isFirebaseReady ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
            >
              {isFirebaseReady ? 'Enviar Reseña' : 'Conectando a la base de datos...'}
            </button>
          </form>

          {/* Lista de reseñas existentes */}
          {bookReviews.length > 0 ? (
            <div className="space-y-4">
              {bookReviews.map(review => (
                <div key={review.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Usuario: {review.user}</span>
                    <div className="flex items-center space-x-1 text-yellow-500">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} size={16} fill="currentColor" stroke="none" />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">{review.text}</p>
                  <div className="flex items-center space-x-4 text-gray-500">
                    <button
                      onClick={() => handleVote(review.id, 'upvote')}
                      className="flex items-center space-x-1 hover:text-green-600 transition-colors"
                    >
                      <ThumbsUp size={18} />
                      <span>{review.upvotes}</span>
                    </button>
                    <button
                      onClick={() => handleVote(review.id, 'downvote')}
                      className="flex items-center space-x-1 hover:text-red-600 transition-colors"
                    >
                      <ThumbsDown size={18} />
                      <span>{review.downvotes}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 italic mt-8">
              Sé el primero en reseñar este libro.
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans antialiased text-gray-900 flex flex-col items-center p-4 sm:p-6 md:p-8">
      {/* Encabezado */}
      <header className="w-full max-w-4xl text-center mb-8">
        <h1 className="text-4xl font-extrabold text-indigo-700 mb-2">
          <Book size={48} className="inline-block mr-2 align-middle" />
          Mi Biblioteca de Reseñas
        </h1>
        <p className="text-lg text-gray-600">Encuentra y comparte reseñas de tus libros favoritos</p>
      </header>

      {/* Formulario de búsqueda */}
      {!selectedBook && (
        <form onSubmit={handleSearch} className="w-full max-w-2xl mb-8">
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
      
      {/* Muestra el ID del usuario para fines de depuración y desarrollo */}
      <p className="text-xs text-gray-400 mb-4">
        {userId ? `ID de Usuario: ${userId}` : 'Cargando usuario...'}
      </p>

      {/* Indicadores de estado (carga/error) */}
      {isLoading && (
        <div className="text-center text-indigo-600 mt-12">
          <p className="text-xl">Cargando...</p>
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative max-w-2xl w-full mt-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}

      {/* Contenido principal: Lista de libros o detalles de un libro */}
      {!isLoading && !error && (
        selectedBook ? <BookDetails /> : <BookList />
      )}
    </div>
  );
}