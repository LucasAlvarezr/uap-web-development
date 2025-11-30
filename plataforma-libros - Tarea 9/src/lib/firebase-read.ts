import { db } from '@/__mocks__/firebase'; 
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

export type ReviewData = {
id: string;
bookId: string;
user: string;
rating: number;
text: string;
upvotes: number;
downvotes: number;
timestamp: string;
};

export async function getReviewsServer(): Promise<ReviewData[]> {
console.log('Fetching reviews on the Server...');

try {
const reviewsCollection = collection(db, 'reviews');
const q = query(reviewsCollection, orderBy('timestamp', 'desc'));

const snapshot = await getDocs(q);

const reviews: ReviewData[] = snapshot.docs.map(doc => {
const data = doc.data();

return {
id: doc.id,
bookId: data.bookId || '',
user: data.user || 'Anónimo',
rating: data.rating || 0,
text: data.text || '',
upvotes: data.upvotes || 0,
downvotes: data.downvotes || 0,
timestamp: data.timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString(),
};
});

return reviews;

} catch (error) {
console.error("Error fetching initial reviews on server:", error);
return [];
}
}
