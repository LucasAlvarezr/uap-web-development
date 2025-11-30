// src/__mocks__/firebase.ts
import { vi } from 'vitest';

// 1. Funciones de Mock
export const mockAddDoc = vi.fn();
export const mockGetDoc = vi.fn();
export const mockUpdateDoc = vi.fn();

// 2. Objetos de Mock (deben simular la estructura de los objetos reales)
export const collection = vi.fn(() => ({} as any));
export const doc = vi.fn(() => ({} as any));

// 3. Objeto de Base de Datos y Timestamp
export const db = {}; 
export const Timestamp = {
  // Simula la función que convierte Date a Timestamp
  fromDate: vi.fn((date) => ({ 
    toDate: () => date,
    toISOString: () => date.toISOString(),
  })),
};

// Exportamos un objeto de referencia para facilitar la manipulación en los tests
export const mocks = {
  addDoc: mockAddDoc,
  getDoc: mockGetDoc,
  updateDoc: mockUpdateDoc,
  Timestamp: Timestamp,
};

// 4. Exportamos las funciones con sus nombres originales para que Vitest las intercepte
// Este paso es crucial para que el 'vi.mock' de actions.test.ts funcione.
export const {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
} = mocks;