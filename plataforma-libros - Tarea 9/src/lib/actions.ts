// src/lib/actions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. MOCK de @/firebase: Intercepta y utiliza el mock de Firebase
// Esto asegura que las acciones no contacten la base de datos real.
vi.mock('@/firebase', async (importOriginal) => {
    const { db, mocks } = await import('../__mocks__/firebase'); 
    return { db, mocks };
});

// 2. MOCK de next/cache: Simula la función de revalidación del caché
const mockRevalidatePath = vi.fn();
vi.mock('next/cache', () => ({
    revalidatePath: mockRevalidatePath,
}));

// Importamos la acción y los mocks para la configuración
import { addReviewAction, voteReviewAction } from './actions';
import { mocks } from '../__mocks__/firebase'; 

// --- PRUEBAS UNITARIAS ---
describe('Server Actions (Lógica de Negocio)', () => {
  
  beforeEach(() => {
    vi.clearAllMocks(); // Limpia el historial de llamadas antes de cada prueba
  });
  
  // ====================================================================
  // 1. Pruebas para addReviewAction
  // ====================================================================
  describe('addReviewAction', () => {
    const validFormData = new FormData();
    validFormData.append('bookId', 'BOOK123');
    validFormData.append('userId', 'USER456');
    validFormData.append('reviewText', 'Un libro excelente.');
    validFormData.append('rating', '5');

    it('debería agregar una reseña con datos válidos y revalidar la ruta', async () => {
      // Configurar el mock para simular una adición exitosa
      mocks.addDoc.mockResolvedValueOnce({ id: 'R1' });

      const result = await addReviewAction(validFormData);

      // Verificaciones principales
      expect(result.success).toBe(true);
      expect(mocks.addDoc).toHaveBeenCalledTimes(1);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/'); 
      
      // Edge Case: Verificar tipos de datos enviados (rating debe ser numérico)
      const dataSent = mocks.addDoc.mock.calls[0][1];
      expect(dataSent.rating).toBe(5); 
      expect(dataSent.upvotes).toBe(0);
      expect(dataSent.timestamp).toBeDefined();
    });

    it('debería retornar error si falta el rating', async () => {
      const invalidData = new FormData();
      invalidData.append('bookId', 'BOOK123');
      invalidData.append('userId', 'USER456');
      invalidData.append('reviewText', 'Texto');
      // Rating faltante
      
      const result = await addReviewAction(invalidData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('inválidos');
      expect(mocks.addDoc).not.toHaveBeenCalled(); 
    });

    it('debería retornar error si el rating está fuera del rango (99)', async () => {
        const invalidData = new FormData();
        invalidData.append('bookId', 'BOOK123');
        invalidData.append('userId', 'USER456');
        invalidData.append('reviewText', 'Texto');
        invalidData.append('rating', '99'); // Rating inválido
        
        const result = await addReviewAction(invalidData);
  
        expect(result.success).toBe(false);
        expect(result.message).toContain('inválidos');
        expect(mocks.addDoc).not.toHaveBeenCalled();
    });
  });

  // ====================================================================
  // 2. Pruebas para voteReviewAction
  // ====================================================================
  describe('voteReviewAction', () => {
    
    it('debería incrementar upvotes en uno para un voto positivo', async () => {
        // Simular la obtención del documento actual
        mocks.getDoc.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ upvotes: 10, downvotes: 5 }), // Datos iniciales
        });
        mocks.updateDoc.mockResolvedValueOnce(undefined);

        const result = await voteReviewAction('R1', 'upvote');

        expect(result.success).toBe(true);
        expect(mocks.getDoc).toHaveBeenCalledTimes(1);
        expect(mocks.updateDoc).toHaveBeenCalledTimes(1);
        
        // Edge Case: Verificar que la actualización se realiza correctamente (10 -> 11)
        const updateData = mocks.updateDoc.mock.calls[0][1];
        expect(updateData.upvotes).toBe(11); 
        expect(mockRevalidatePath).toHaveBeenCalledWith('/');
    });

    it('debería incrementar downvotes en uno para un voto negativo', async () => {
        // Simular la obtención del documento actual
        mocks.getDoc.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ upvotes: 10, downvotes: 5 }), // Datos iniciales
        });
        mocks.updateDoc.mockResolvedValueOnce(undefined);

        const result = await voteReviewAction('R1', 'downvote');

        expect(result.success).toBe(true);
        expect(mocks.getDoc).toHaveBeenCalledTimes(1);
        expect(mocks.updateDoc).toHaveBeenCalledTimes(1);
        
        // Edge Case: Verificar que la actualización se realiza correctamente (5 -> 6)
        const updateData = mocks.updateDoc.mock.calls[0][1];
        expect(updateData.downvotes).toBe(6); 
        expect(mockRevalidatePath).toHaveBeenCalledWith('/');
    });

    it('debería retornar error si la reseña no existe (Edge Case)', async () => {
        // Simular que el documento no existe
        mocks.getDoc.mockResolvedValueOnce({
            exists: () => false,
            data: () => null,
        });

        const result = await voteReviewAction('R99', 'upvote');

        expect(result.success).toBe(false);
        expect(result.message).toBe('Reseña no encontrada.');
        expect(mocks.updateDoc).not.toHaveBeenCalled(); 
        expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });
});