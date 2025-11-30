// src/components/BookDetailsClient.tsx
"use client";

import Image from 'next/image';
import { Star, ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { voteReviewAction, addReviewAction } from '@/lib/actions';

import {
BarChart,
Bar,
XAxis,
YAxis,
Tooltip,
ResponsiveContainer,
} from 'recharts';

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

interface BookDetailsProps {
selectedBook: any;
reviews: Review[];
setSelectedBook: (book: any | null) => void;
userId: string | null;
}

function SubmitButton() {
const { pending } = useFormStatus();
return (
<button
type="submit"
disabled={pending}
className={`w-full font-bold py-2 px-4 rounded-md transition-colors ${pending ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
>
{pending ? 'Enviando...' : 'Enviar Reseña'}
</button>
);
}

export default function BookDetails({ selectedBook, reviews, setSelectedBook, userId }: BookDetailsProps) {
const volumeInfo = selectedBook?.volumeInfo || {};
const thumbnail = volumeInfo.imageLinks?.thumbnail || 'https://placehold.co/128x192?text=Sin+Imagen';

const ratingCounts = [0, 0, 0, 0, 0];
reviews.forEach(review => {
if (review.rating >= 1 && review.rating <= 5) {
ratingCounts[review.rating - 1]++;
}
});

const ratingData = ratingCounts.map((count, index) => ({
name: `${index + 1}★`,
reseñas: count,
}));

const handleVoteAction = async (reviewId: string, type: 'upvote' | 'downvote') => {
const result = await voteReviewAction(reviewId, type);
if (!result.success) {
console.error(result.message);
alert(`Error al votar: ${result.message}`);
}
};

const handleReviewSubmit = async (formData: FormData) => {
if (!userId) {
alert("Usuario no autenticado. Inténtalo de nuevo.");
return;
}
formData.append('userId', userId);
formData.append('bookId', selectedBook.id);
const result = await addReviewAction(formData);
if (result.success) {
alert('Reseña enviada con éxito!');
} else {
alert(`Error: ${result.message}`);
}
};

return (
<div className="bg-white rounded-xl shadow-xl p-6 md:p-8 space-y-8 max-w-4xl mx-auto my-6 relative">
<button
onClick={() => setSelectedBook(null)}
className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
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
Publicado por {volumeInfo.publisher || 'Desconocido'} el {volumeInfo.publishedDate || 'Fecha Desconocida'}.
</p>
<p className="text-gray-800 leading-relaxed max-h-48 overflow-y-auto pr-2">
{volumeInfo.description || 'No hay descripción disponible para este libro.'}
</p>
</div>
</div>

<div className="h-40 w-full">
<ResponsiveContainer width="100%" height="100%">
<BarChart data={ratingData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
<XAxis type="number" hide />
<YAxis dataKey="name" type="category" stroke="#6366f1" />
<Tooltip />
<Bar dataKey="reseñas" fill="#6366f1" radius={[4, 4, 0, 0]} />
</BarChart>
</ResponsiveContainer>
</div>

<form action={handleReviewSubmit} className="p-4 bg-gray-50 rounded-lg shadow-inner">
<h4 className="text-lg font-semibold mb-4">Escribe tu Reseña</h4>
<div className="mb-4">
<label htmlFor="rating" className="block text-gray-700 font-medium mb-2">Calificación (1-5 estrellas):</label>
<select name="rating" id="rating" className="w-full p-2 border border-gray-300 rounded-md">
{[1, 2, 3, 4, 5].map(star => (<option key={star} value={star}>{star} {star === 1 ? 'estrella' : 'estrellas'}</option>))}
</select>
</div>
<div className="mb-4">
<label htmlFor="reviewText" className="block text-gray-700 font-medium mb-2">Tu Reseña:</label>
<textarea
id="reviewText"
name="reviewText"
rows={4}
className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
placeholder="Comparte tu opinión sobre el libro..."
required
></textarea>
</div>
<SubmitButton />
</form>

{reviews.length > 0 ? (
<div className="space-y-4">
{reviews.map(review => (
<div key={review.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
<p className="text-gray-700 mb-3">{review.text}</p>
<div className="flex items-center space-x-4 text-gray-500">
<button onClick={() => handleVoteAction(review.id, 'upvote')} className="flex items-center space-x-1 hover:text-green-600 transition-colors">
<ThumbsUp size={18} /><span>{review.upvotes}</span>
</button>
<button onClick={() => handleVoteAction(review.id, 'downvote')} className="flex items-center space-x-1 hover:text-red-600 transition-colors">
<ThumbsDown size={18} /><span>{review.downvotes}</span>
</button>
</div>
</div>
))}
</div>
) : (
<p className="text-center text-gray-500 italic mt-8">Sé el primero en reseñar este libro.</p>
)}
</div>
);
}
