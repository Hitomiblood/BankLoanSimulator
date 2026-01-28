/**
 * Navigation Utilities
 * 
 * Abstracción de navegación para facilitar testing y mantener
 * el código desacoplado de implementaciones específicas del navegador.
 * 
 * Ventajas:
 * - Fácil de testear con jest.spyOn()
 * - Independiente de jsdom y sus limitaciones
 * - Preparado para migración a React Router
 * - Single Responsibility Principle
 */

/**
 * Navega a la página de inicio
 */
export const goHome = (): void => {
  window.location.assign('/');
};

/**
 * Navega a la página de login
 */
export const goToLogin = (): void => {
  window.location.assign('/login');
};

/**
 * Recarga la página actual
 */
export const reloadPage = (): void => {
  window.location.reload();
};

/**
 * Navega hacia atrás en el historial
 */
export const goBack = (): void => {
  window.history.back();
};
