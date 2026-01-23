// 🎯 EJEMPLOS PRÁCTICOS - Manejo de Errores
// Este archivo contiene ejemplos de cómo usar el sistema de manejo de errores

import api from '../api/axios';
import {
  showErrorToast,
  showSuccessToast,
  showWarningToast,
  showInfoToast,
  handleError,
  withErrorHandling,
} from '../utils/errorHandler';

// =========================================
// EJEMPLO 1: Login con Manejo de Errores
// =========================================

export const loginExample = async (email: string, password: string) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    showSuccessToast('¡Bienvenido de vuelta!');
    return response.data;
  } catch (error) {
    // El interceptor ya maneja 401, 500, etc.
    // Solo manejamos casos específicos de login
    if (isAxiosError(error) && error.response?.status === 400) {
      showErrorToast(error, 'Email o contraseña incorrectos');
    } else {
      showErrorToast(error);
    }
    throw error;
  }
};

// =========================================
// EJEMPLO 2: Crear Préstamo con Validación
// =========================================

export const createLoanExample = async (loanData: {
  amount: number;
  interestRate: number;
  termInMonths: number;
}) => {
  // Validación previa
  if (!loanData.amount || loanData.amount <= 0) {
    showWarningToast('El monto debe ser mayor a 0');
    return;
  }

  if (loanData.interestRate < 0 || loanData.interestRate > 50) {
    showWarningToast('La tasa de interés debe estar entre 0% y 50%');
    return;
  }

  try {
    showInfoToast('Procesando tu solicitud...');
    const response = await api.post('/loans', loanData);
    showSuccessToast('¡Préstamo solicitado exitosamente!');
    return response.data;
  } catch (error) {
    showErrorToast(error, 'No se pudo crear el préstamo');
    throw error;
  }
};

// =========================================
// EJEMPLO 3: Actualizar Estado con Confirmación
// =========================================

export const updateLoanStatusExample = async (
  loanId: string,
  status: string,
  comments?: string
) => {
  try {
    await api.put(`/loans/${loanId}/review`, { status, adminComments: comments });
    
    // Mensaje específico según el estado
    const messages: Record<string, string> = {
      approved: '¡Préstamo aprobado exitosamente!',
      rejected: 'Préstamo rechazado',
      pending: 'Préstamo marcado como pendiente',
    };
    
    showSuccessToast(messages[status] || 'Estado actualizado');
  } catch (error) {
    handleError(error, 'No se pudo actualizar el estado del préstamo');
  }
};

// =========================================
// EJEMPLO 4: Carga de Datos con Loading State
// =========================================

export const fetchLoansWithLoadingExample = async (
  setLoading: (loading: boolean) => void,
  setData: (data: unknown[]) => void
) => {
  try {
    setLoading(true);
    const response = await api.get('/loans');
    setData(response.data);
    
    // Toast opcional para confirmar carga
    if (response.data.length === 0) {
      showInfoToast('No hay préstamos registrados');
    }
  } catch (error) {
    showErrorToast(error, 'Error al cargar los préstamos');
    setData([]); // Limpiar datos en caso de error
  } finally {
    setLoading(false);
  }
};

// =========================================
// EJEMPLO 5: Operación con Retry
// =========================================

export const fetchWithRetryExample = async (
  endpoint: string,
  maxRetries: number = 3
): Promise<unknown> => {
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        showWarningToast(`Reintentando... (${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  showErrorToast(lastError, 'No se pudo completar la operación después de varios intentos');
  throw lastError;
};

// =========================================
// EJEMPLO 6: Usando withErrorHandling Wrapper
// =========================================

// Función sin manejo de errores
const unsafeFetchLoans = async () => {
  const response = await api.get('/loans');
  return response.data;
};

// Envolver con manejo automático de errores
export const safeFetchLoans = withErrorHandling(
  unsafeFetchLoans,
  'Error al cargar préstamos'
);

// Uso
// const loans = await safeFetchLoans();

// =========================================
// EJEMPLO 7: Upload de Archivo con Progreso
// =========================================

export const uploadDocumentExample = async (
  file: File,
  loanId: string,
  onProgress?: (progress: number) => void
) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('loanId', loanId);

  try {
    showInfoToast('Subiendo documento...');
    
    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress?.(percentCompleted);
        }
      },
    });
    
    showSuccessToast('¡Documento subido exitosamente!');
    return response.data;
  } catch (error) {
    showErrorToast(error, 'Error al subir el documento');
    throw error;
  }
};

// =========================================
// EJEMPLO 8: Batch Operations con Feedback
// =========================================

export const batchApproveLoanExample = async (loanIds: string[]) => {
  const results = {
    success: [] as string[],
    failed: [] as string[],
  };

  showInfoToast(`Procesando ${loanIds.length} préstamos...`);

  for (const loanId of loanIds) {
    try {
      await api.put(`/loans/${loanId}/review`, { status: 'approved' });
      results.success.push(loanId);
    } catch (error) {
      results.failed.push(loanId);
      console.error(`Error aprobando préstamo ${loanId}:`, error);
    }
  }

  // Mostrar resumen
  if (results.failed.length === 0) {
    showSuccessToast(`¡${results.success.length} préstamos aprobados!`);
  } else {
    showWarningToast(
      `${results.success.length} aprobados, ${results.failed.length} fallidos`
    );
  }

  return results;
};

// =========================================
// EJEMPLO 9: Formulario con Validación Inline
// =========================================

export const validateLoanFormExample = (formData: {
  amount: string;
  interestRate: string;
  termInMonths: string;
}) => {
  const errors: Record<string, string> = {};

  // Validar monto
  const amount = parseFloat(formData.amount);
  if (isNaN(amount) || amount < 1000) {
    errors.amount = 'El monto mínimo es €1,000';
  } else if (amount > 1000000) {
    errors.amount = 'El monto máximo es €1,000,000';
  }

  // Validar tasa de interés
  const rate = parseFloat(formData.interestRate);
  if (isNaN(rate) || rate < 0) {
    errors.interestRate = 'La tasa debe ser mayor o igual a 0%';
  } else if (rate > 50) {
    errors.interestRate = 'La tasa máxima es 50%';
  }

  // Validar plazo
  const term = parseInt(formData.termInMonths);
  if (isNaN(term) || term < 1) {
    errors.termInMonths = 'El plazo mínimo es 1 mes';
  } else if (term > 240) {
    errors.termInMonths = 'El plazo máximo es 240 meses';
  }

  // Mostrar toast si hay errores
  if (Object.keys(errors).length > 0) {
    showWarningToast('Por favor corrige los errores en el formulario');
  }

  return errors;
};

// =========================================
// EJEMPLO 10: Offline Detection
// =========================================

export const checkOnlineStatusExample = () => {
  const handleOnline = () => {
    showSuccessToast('Conexión restaurada');
  };

  const handleOffline = () => {
    showWarningToast('Sin conexión a internet. Algunas funciones no estarán disponibles.');
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Cleanup
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// =========================================
// EJEMPLO 11: Manejo de Sesión Expirada
// =========================================

export const refreshTokenExample = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      showWarningToast('Sesión expirada. Por favor inicia sesión nuevamente.');
      window.location.href = '/login';
      return;
    }

    const response = await api.post('/auth/refresh', { refreshToken });
    localStorage.setItem('token', response.data.token);
    showInfoToast('Sesión renovada');
  } catch (error) {
    showErrorToast(error, 'No se pudo renovar la sesión');
    localStorage.clear();
    window.location.href = '/login';
  }
};

// =========================================
// EJEMPLO 12: Confirmación antes de Acción Destructiva
// =========================================

export const deleteLoanWithConfirmationExample = async (
  loanId: string,
  showConfirmDialog: (message: string) => Promise<boolean>
) => {
  const confirmed = await showConfirmDialog(
    '¿Estás seguro de que deseas eliminar este préstamo? Esta acción no se puede deshacer.'
  );

  if (!confirmed) {
    showInfoToast('Operación cancelada');
    return;
  }

  try {
    await api.delete(`/loans/${loanId}`);
    showSuccessToast('Préstamo eliminado exitosamente');
  } catch (error) {
    showErrorToast(error, 'No se pudo eliminar el préstamo');
    throw error;
  }
};

// =========================================
// EJEMPLO 13: Rate Limiting Detection
// =========================================

export const handleRateLimitExample = (error: unknown) => {
  if (isAxiosError(error) && error.response?.status === 429) {
    const retryAfter = error.response.headers['retry-after'];
    const message = retryAfter
      ? `Demasiadas solicitudes. Por favor espera ${retryAfter} segundos.`
      : 'Demasiadas solicitudes. Por favor espera un momento.';
    
    showWarningToast(message);
    return true;
  }
  return false;
};

// =========================================
// USO EN COMPONENTES REACT
// =========================================

/*
// Ejemplo en un componente funcional
import { useState } from 'react';
import { fetchLoansWithLoadingExample } from './errorHandlingExamples';

function LoansComponent() {
  const [loading, setLoading] = useState(false);
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    fetchLoansWithLoadingExample(setLoading, setLoans);
  }, []);

  if (loading) return <CircularProgress />;
  
  return (
    <div>
      {loans.map(loan => (
        <LoanCard key={loan.id} loan={loan} />
      ))}
    </div>
  );
}
*/

// =========================================
// TIPS Y MEJORES PRÁCTICAS
// =========================================

/*
1. SIEMPRE usar try-catch en operaciones asíncronas
2. Proporcionar mensajes específicos al usuario
3. Usar showWarningToast para validaciones
4. Usar showSuccessToast para confirmaciones
5. Usar showInfoToast para información no crítica
6. Usar showErrorToast para errores
7. El interceptor maneja errores comunes automáticamente
8. Re-lanzar errores si el componente padre necesita manejarlos
9. Deshabilitar UI durante operaciones (loading states)
10. Validar datos antes de enviar al servidor
*/

export default {
  loginExample,
  createLoanExample,
  updateLoanStatusExample,
  fetchLoansWithLoadingExample,
  fetchWithRetryExample,
  safeFetchLoans,
  uploadDocumentExample,
  batchApproveLoanExample,
  validateLoanFormExample,
  checkOnlineStatusExample,
  refreshTokenExample,
  deleteLoanWithConfirmationExample,
  handleRateLimitExample,
};
