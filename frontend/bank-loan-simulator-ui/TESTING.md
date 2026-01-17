# 🧪 Testing - Frontend Bank Loan Simulator

## ✅ Configuración Completada

Este documento describe la implementación del sistema de testing para el frontend de Bank Loan Simulator utilizando Jest y React Testing Library.

---

## 📦 Dependencias Instaladas

```json
{
  "devDependencies": {
    "@jest/globals": "^30.2.0",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.1",
    "@testing-library/user-event": "^14.6.1",
    "@types/jest": "^30.0.0",
    "diff": "^8.0.3",
    "identity-obj-proxy": "^3.0.0",
    "jest": "^30.2.0",
    "jest-environment-jsdom": "^30.2.0",
    "jsdom": "^27.4.0",
    "ts-jest": "^29.4.6",
    "ts-node": "^10.9.2"
  },
  "overrides": {
    "diff": "^8.0.3"
  }
}
```

**Nota:** La sección `overrides` fuerza la versión segura de `diff` en todas las dependencias transitivas, eliminando vulnerabilidades de seguridad.

---

## 🛠️ Archivos de Configuración

### jest.config.ts
Configuración principal de Jest con soporte para:
- TypeScript con ts-jest
- JSX y React
- Ambiente jsdom para simular el navegador
- Cobertura de código con umbral del 70%
- Mapeo de módulos CSS
- Referencia a tsconfig.test.json para configuración de TypeScript

### tsconfig.test.json
Configuración específica de TypeScript para tests:
- Extiende tsconfig.app.json
- Módulos CommonJS para compatibilidad con Jest
- Tipos específicos de Jest y Testing Library
- isolatedModules habilitado para mejor performance

### tsconfig.app.json
Actualizado para incluir:
- Tipos de Jest y Testing Library
- isolatedModules: true (requerido por ts-jest)

### src/setupTests.ts
Configuración global de tests:
- Import de `@testing-library/jest-dom` para matchers personalizados
- Polyfills para TextEncoder/TextDecoder (React Router)
- Mock de localStorage
- Mock de matchMedia (Material-UI)
- Limpieza automática de mocks después de cada test

### tsconfig.app.json
Actualizado para incluir tipos de Jest y Testing Library

---

## 📝 Scripts Disponibles

```bash
# Ejecutar todos los tests una vez
npm test

# Ejecutar tests en modo watch (desarrollo)
npm run test:watch

# Ejecutar tests con reporte de cobertura
npm run test:coverage
```

---

## ✅ Tests Implementados

### 1. **LoanCard.test.tsx** (18 tests) ✅
Componente: `src/components/LoanCard.tsx`

**Cobertura:**
- ✅ Renderizado básico
- ✅ Formateo de moneda y fechas
- ✅ Estados del préstamo (Pendiente, Aprobado, Rechazado)
- ✅ Visualización condicional de usuario
- ✅ Información adicional (fecha de revisión, comentarios)

**Tests destacados:**
```typescript
it('debe mostrar el monto del préstamo formateado correctamente')
it('debe mostrar chip "Pendiente" con color warning')
it('debe mostrar información del usuario cuando showUser=true')
it('debe formatear correctamente montos grandes')
```

---

### 2. **Navbar.test.tsx** (15 tests) ✅
Componente: `src/components/Navbar.tsx`

**Cobertura:**
- ✅ Renderizado del título y botones
- ✅ Vista de usuario vs vista de administrador
- ✅ Navegación entre páginas
- ✅ Funcionalidad de logout
- ✅ Limpieza de localStorage

**Tests destacados:**
```typescript
it('debe navegar a /loans al hacer clic en "Mis Préstamos"')
it('debe mostrar el botón "Gestionar Préstamos" para admin')
it('debe llamar a logout y navegar a /login')
it('debe limpiar el localStorage al hacer logout')
```

---

### 3. **AuthContext.test.tsx** (11 tests) ✅
Contexto: `src/auth/AuthContext.tsx`

**Cobertura:**
- ✅ Inicialización con/sin token
- ✅ Función login (estado y localStorage)
- ✅ Función logout (estado y localStorage)
- ✅ Flujos completos login/logout
- ✅ Persistencia entre re-renders

**Tests destacados:**
```typescript
it('debe inicializar con token si existe en localStorage')
it('debe guardar el token en el estado y localStorage')
it('debe permitir múltiples ciclos de login/logout')
it('debe mantener el token después de login entre re-renders')
```

---

### 4. **Login.test.tsx** (14 tests) ✅
Página: `src/pages/Login.tsx`

**Cobertura:**
- ✅ Renderizado del formulario completo
- ✅ Interacción del usuario (escribir en inputs)
- ✅ Login exitoso (usuario y admin)
- ✅ Manejo de errores (credenciales incorrectas, red)
- ✅ Estados de carga
- ✅ Validación de formularios

**Tests destacados:**
```typescript
it('debe iniciar sesión correctamente y redirigir a /loans para usuario normal')
it('debe iniciar sesión correctamente y redirigir a /admin para administrador')
it('debe mostrar mensaje de error cuando las credenciales son incorrectas')
it('debe mostrar "Cargando..." mientras procesa el login')
it('debe limpiar el error cuando se vuelve a enviar el formulario')
```

---

## 📊 Reporte de Cobertura

### Resumen General
```
Test Suites: 4 passed
Tests:       58 passed
Time:        ~15s
```

### Cobertura por Módulo

| Archivo | Statements | Branches | Functions | Lines | Estado |
|---------|-----------|----------|-----------|-------|--------|
| **AuthContext.tsx** | ✅ 100% | ✅ 100% | ✅ 100% | ✅ 100% | Completo |
| **Login.tsx** | ✅ 100% | ✅ 100% | ✅ 100% | ✅ 100% | Completo |
| **Navbar.tsx** | ✅ 100% | 66.66% | ✅ 100% | ✅ 100% | Casi completo |
| **LoanCard.tsx** | 90% | 87.5% | ✅ 100% | 90% | Casi completo |

### Archivos sin Tests (Próximos pasos)
- ❌ AdminLoans.tsx (0% coverage)
- ❌ RequestLoan.tsx (0% coverage)
- ❌ UserLoans.tsx (0% coverage)
- ❌ PrivateRoute.tsx (0% coverage)
- ❌ App.tsx (0% coverage)

---

## 🎯 Próximos Pasos - Testing Fase 1.1

### Prioridad Alta
1. **UserLoans.test.tsx** - Página de préstamos del usuario
   - Lista de préstamos
   - Filtrado/búsqueda
   - Estados vacíos
   - Manejo de errores

2. **RequestLoan.test.tsx** - Formulario de solicitud
   - Validación de campos
   - Submit exitoso
   - Cálculo de cuota mensual
   - Manejo de errores

3. **AdminLoans.test.tsx** - Gestión de préstamos (admin)
   - Lista de préstamos
   - Aprobar/rechazar préstamos
   - Filtros y búsqueda
   - Modals de confirmación

### Prioridad Media
4. **PrivateRoute.test.tsx** - Protección de rutas
5. **App.test.tsx** - Routing principal

### Objetivo de Cobertura
- **Meta global:** 70% (establecido en jest.config.ts)
- **Estado actual:** ~35%
- **Con los próximos tests:** >70% esperado

---

## 🧪 Buenas Prácticas Implementadas

### 1. **Organización de Tests**
```
src/
├── __tests__/
│   ├── auth/
│   │   └── AuthContext.test.tsx
│   ├── components/
│   │   ├── LoanCard.test.tsx
│   │   └── Navbar.test.tsx
│   └── pages/
│       └── Login.test.tsx
```

### 2. **Patrón AAA (Arrange-Act-Assert)**
```typescript
it('debe hacer algo', () => {
  // Arrange: Preparar
  render(<Component />);
  
  // Act: Actuar
  fireEvent.click(button);
  
  // Assert: Verificar
  expect(result).toBe(expected);
});
```

### 3. **Mocking Apropiado**
- ✅ Mocks de API con `jest.mock()`
- ✅ Mocks de navegación (React Router)
- ✅ Limpieza de mocks con `beforeEach()`
- ✅ Simulación de localStorage

### 4. **Tests Descriptivos**
```typescript
describe('Componente o Módulo', () => {
  describe('Funcionalidad específica', () => {
    it('debe hacer algo específico', () => {
      // Test aquí
    });
  });
});
```

### 5. **Uso de Testing Library Best Practices**
- ✅ Queries por rol y texto visible (`getByRole`, `getByText`)
- ✅ Espera de elementos asíncronos con `waitFor()`
- ✅ Simulación de eventos del usuario con `fireEvent`
- ✅ Matchers de jest-dom (`toBeInTheDocument`, `toHaveClass`)

---

## 📚 Recursos y Documentación

### Jest
- [Documentación oficial](https://jestjs.io/)
- [API de Jest](https://jestjs.io/docs/api)
- [Mocking en Jest](https://jestjs.io/docs/mock-functions)

### React Testing Library
- [Documentación oficial](https://testing-library.com/react)
- [Queries](https://testing-library.com/docs/queries/about)
- [Testing Playground](https://testing-playground.com/)

### Material-UI Testing
- [Testing Guide](https://mui.com/material-ui/guides/testing/)

---

## 🐛 Troubleshooting

### Error: "toBeInTheDocument is not defined"
**Solución:** Asegúrate de importar `@testing-library/jest-dom` en el test o en setupTests.ts

### Error: "TextEncoder is not defined"
**Solución:** Ya está configurado en setupTests.ts con el polyfill

### Error: "Cannot find module 'axios'"
**Solución:** Mock de axios configurado en los tests que lo necesitan

### Warning: "isolatedModules is deprecated in jest.config"
**Solución:** Configurar `isolatedModules: true` en tsconfig.app.json y tsconfig.test.json en lugar de jest.config.ts

### Vulnerabilidades de seguridad (npm audit)
**Solución:** Agregar sección `overrides` en package.json para forzar versiones seguras:
```json
{
  "overrides": {
    "diff": "^8.0.3"
  }
}
```

### Tests lentos
**Solución:** 
- Usar `jest --maxWorkers=4` para limitar workers
- El flag `isolatedModules: true` en tsconfig mejora la performance

---

## ✨ Conclusión

La Fase 1.1 del Plan de Mejoras está **COMPLETADA EN UN 60%**:

✅ **Configurado:**
- Jest + React Testing Library
- Setup de tests
- Scripts de npm
- 58 tests funcionando
- 4 componentes/páginas testeados

⏳ **Pendiente:**
- Tests para páginas restantes (UserLoans, RequestLoan, AdminLoans)
- Tests para PrivateRoute
- Alcanzar 70% de cobertura global
- Configurar Husky + lint-staged

**¡El foundation de testing está sólido y listo para expandir!** 🚀
