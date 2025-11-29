import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './page';
import {
  initializeApp,
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  getFirestore,
  collection,
  query,
  addDoc,
  onSnapshot,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';

// Mockear todas las funciones y módulos de Firebase que se usan en la aplicación.
vi.mock('firebase/app', () => ({ initializeApp: vi.fn() }));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInAnonymously: vi.fn(() => Promise.resolve({ user: { uid: 'mock-user-id' } })),
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback({ uid: 'mock-user-id' });
    return vi.fn();
  }),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(() => Promise.resolve({ id: 'mock-review-id' })),
  onSnapshot: vi.fn((q, callback) => {
    callback({
      forEach: (cb) => {
        cb({ id: 'review1', data: () => ({ bookId: 'book1', rating: 5, text: 'Great!', upvotes: 1 }) });
      }
    });
    return vi.fn();
  }),
  getDoc: vi.fn(() => Promise.resolve({
    exists: () => true,
    data: () => ({ upvotes: 5, downvotes: 2 })
  })),
  updateDoc: vi.fn(() => Promise.resolve()),
}));

// Mockear la función fetch global para simular respuestas de la API de Google Books.
global.fetch = vi.fn((url) => {
  if (url.includes('volumes?q=')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        items: [{
          id: 'book1',
          volumeInfo: {
            title: 'Mock Book',
            authors: ['Author 1'],
            imageLinks: { thumbnail: 'mock-thumbnail.jpg' }
          }
        }]
      })
    });
  }
  if (url.includes('volumes/book1')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        id: 'book1',
        volumeInfo: {
          title: 'Mock Book',
          authors: ['Author 1'],
          description: 'A mock book description.'
        }
      })
    });
  }
  // Mockear la respuesta para la API de Gemini (aunque no esté en el enunciado, se mantiene en el código para pruebas)
  if (url.includes('gemini-2.5-flash-preview-05-20')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{ content: { parts: [{ text: 'This is a mock AI generated review.' }] } }]
      })
    });
  }
  return Promise.resolve({ ok: false });
});

// Describir el conjunto de pruebas para el componente principal App.
describe('App Component', () => {

  // Limpiar los mocks antes de cada prueba para asegurar que las pruebas son independientes.
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the search form initially', () => {
    render(<App />);
    expect(screen.getByPlaceholderText('Buscar por título, autor o ISBN...')).toBeDefined();
    expect(screen.getByText('Mi Biblioteca de Reseñas')).toBeDefined();
  });

  it('should display books after a successful search', async () => {
    render(<App />);
    const searchInput = screen.getByPlaceholderText('Buscar por título, autor o ISBN...');
    const searchButton = screen.getByRole('button', { name: /search/i }); // El botón no tiene nombre visible, se usa el role

    fireEvent.change(searchInput, { target: { value: 'Mock Book' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Mock Book')).toBeDefined();
      expect(screen.getByText('Autor 1')).toBeDefined();
    });
  });

  it('should show book details when a book is selected', async () => {
    render(<App />);
    // Primero, simular la búsqueda para que aparezcan los libros
    const searchInput = screen.getByPlaceholderText('Buscar por título, autor o ISBN...');
    fireEvent.change(searchInput, { target: { value: 'Mock Book' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText('Mock Book')).toBeDefined();
    });

    // Luego, hacer clic en el libro
    fireEvent.click(screen.getByText('Mock Book'));

    await waitFor(() => {
      expect(screen.getByText('A mock book description.')).toBeDefined();
      expect(screen.getByText('Reseñas y Calificaciones')).toBeDefined();
    });
  });

  it('should add a new review successfully', async () => {
    // Simular que un libro está seleccionado
    const mockBook = {
      id: 'book1',
      volumeInfo: { title: 'Test Book' }
    };
    render(<App />, { initialState: { selectedBook: mockBook } });
    
    // Simular la selección de un libro y esperar que se carguen los detalles
    await waitFor(() => {
        expect(screen.getByText('Escribe tu Reseña')).toBeDefined();
    });

    // Rellenar el formulario de reseña
    fireEvent.change(screen.getByLabelText(/Calificación/i), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText(/Tu Reseña/i), { target: { value: 'Me gustó mucho.' } });
    fireEvent.click(screen.getByText('Enviar Reseña'));

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalled();
    });
  });

  it('should upvote a review when the upvote button is clicked', async () => {
    render(<App />);
    // Simular la selección de un libro para que las reseñas aparezcan
    const searchInput = screen.getByPlaceholderText('Buscar por título, autor o ISBN...');
    fireEvent.change(searchInput, { target: { value: 'Mock Book' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Mock Book')).toBeDefined();
    });
    fireEvent.click(screen.getByText('Mock Book'));

    await waitFor(() => {
      expect(screen.getByText('Great!')).toBeDefined();
    });
    
    // Encontrar y hacer clic en el botón de upvote
    const upvoteButton = screen.getByLabelText(/upvote/i);
    fireEvent.click(upvoteButton);
    
    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalled();
    });
  });

});