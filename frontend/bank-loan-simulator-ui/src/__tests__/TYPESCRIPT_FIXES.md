# 🔧 Corrección de Alertas de TypeScript en Tests

**Fecha:** 18 de enero de 2026  
**Autor:** Sistema de Testing - Bank Loan Simulator

---

## 📋 Resumen Ejecutivo

Este documento detalla las **correcciones aplicadas** a los archivos de test del proyecto para **eliminar todas las alertas de TypeScript** que impedían una compilación limpia y obstaculizaban el desarrollo.

### ✅ Estado Final
- **Archivos corregidos:** 5
- **Errores eliminados:** 73 → 0
- **Tiempo de resolución:** ~10 minutos
- **Compilación TypeScript:** ✅ Sin errores

---

## 🔍 Análisis de Problemas Encontrados

### 1️⃣ **Error Principal: `toBeInTheDocument` no reconocido**

**Síntoma:**
```typescript
Property 'toBeInTheDocument' does not exist on type 'Matchers<void, HTMLElement>'
```

**Causa Raíz:**
- El import de `expect` desde `@jest/globals` sobrescribía los tipos extendidos de `@testing-library/jest-dom`
- TypeScript no podía reconocer los matchers personalizados de jest-dom

**Solución Aplicada:**
```typescript
// ❌ ANTES (incorrecto)
import { describe, it, expect, jest } from '@jest/globals';
import '@testing-library/jest-dom';

// ✅ DESPUÉS (correcto)
import { describe, it, jest } from '@jest/globals';
import '@testing-library/jest-dom';
// expect se toma del global scope donde jest-dom lo extiende correctamente
```

**Archivos afectados:**
- ✅ LoanCard.test.tsx
- ✅ Navbar.test.tsx
- ✅ Login.test.tsx

**Explicación técnica:**
- `@testing-library/jest-dom` extiende el tipo global `expect` con matchers personalizados como `toBeInTheDocument()`
- Al importar `expect` explícitamente desde `@jest/globals`, TypeScript usa ese tipo específico en lugar del tipo extendido global
- La solución es usar el `expect` global que ya ha sido extendido por jest-dom

---

### 2️⃣ **Error: Spread operator en `jest.requireActual`**

**Síntoma:**
```typescript
Spread types may only be created from object types.
```

**Causa:**
- TypeScript no puede inferir el tipo de retorno de `jest.requireActual()` sin type assertion

**Solución Aplicada:**
```typescript
// ❌ ANTES
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// ✅ DESPUÉS
jest.mock('react-router-dom', () => ({
  ...(jest.requireActual('react-router-dom') as any),
  useNavigate: () => mockNavigate,
}));
```

**Archivos afectados:**
- ✅ Navbar.test.tsx
- ✅ Login.test.tsx
- ✅ UserLoans.test.tsx

**Explicación técnica:**
- `jest.requireActual()` retorna tipo `unknown` por defecto
- El spread operator `...` requiere un tipo objeto conocido
- El `as any` permite a TypeScript aceptar el spread sin validación estricta

---

### 3️⃣ **Error: Tipos incorrectos en datos mock**

**Síntoma:**
```typescript
Type 'number' is not assignable to type 'string'.
Type 'null' is not assignable to type 'string | undefined'.
```

**Causa:**
- Los datos mock usaban tipos primitivos incompatibles con la interfaz `Loan`
- La interfaz esperaba `id: string` pero los mocks usaban `id: number`
- Los campos opcionales con `null` debían ser `undefined` o string

**Solución Aplicada:**
```typescript
// ❌ ANTES
const mockLoans: Loan[] = [
  {
    id: 1,                    // ❌ number en lugar de string
    userId: 1,                // ❌ number en lugar de string
    reviewDate: null,         // ❌ null en lugar de undefined
    adminComments: null,      // ❌ null en lugar de undefined
    userName: 'Juan Pérez',   // ❌ propiedad incorrecta
    // ...
  }
];

// ✅ DESPUÉS
const mockLoans: Loan[] = [
  {
    id: '1',                  // ✅ string
    userId: '1',              // ✅ string
    reviewDate: undefined,    // ✅ undefined para campos opcionales vacíos
    adminComments: undefined, // ✅ undefined
    user: {                   // ✅ estructura correcta según interfaz
      fullName: 'Juan Pérez',
      email: 'juan.perez@example.com',
    },
    // ...
  }
];
```

**Archivos afectados:**
- ✅ AdminLoans.test.tsx
- ✅ UserLoans.test.tsx

**Explicación técnica:**
- TypeScript valida estrictamente que los datos mock cumplan con las interfaces definidas
- `null` y `undefined` no son intercambiables en TypeScript estricto
- La propiedad `userName` no existe en la interfaz `Loan`, debe usarse `user.fullName`

---

### 4️⃣ **Error: Type casting en Promise mock**

**Síntoma:**
```typescript
Object literal may only specify known properties, and 'data' does not exist in type 'PromiseLike<R>'.
```

**Causa:**
- El mock de axios.post retorna una Promise que TypeScript no reconoce como compatible con AxiosResponse

**Solución Aplicada:**
```typescript
// ❌ ANTES
mockedApi.post.mockImplementationOnce(() => 
  new Promise((resolve) => setTimeout(() => resolve({
    data: { token: 'test', isAdmin: false }
  }), 100))
);

// ✅ DESPUÉS
mockedApi.post.mockImplementationOnce(() => 
  new Promise((resolve) => setTimeout(() => resolve({
    data: { token: 'test', isAdmin: false }
  }), 100)) as any
);
```

**Archivos afectados:**
- ✅ Login.test.tsx

**Explicación técnica:**
- Jest mocks de funciones asíncronas requieren type casting cuando la estructura de retorno no coincide exactamente con la firma original
- El `as any` al final de la Promise permite que TypeScript acepte la estructura mock sin validación estricta

---

### 5️⃣ **Mejora: Inclusión de jest.d.ts en tsconfig**

**Cambio aplicado en `tsconfig.test.json`:**
```jsonc
{
  "include": [
    "src/**/*.test.ts", 
    "src/**/*.test.tsx", 
    "src/setupTests.ts",
    "src/jest.d.ts"  // ✅ Agregado para asegurar inclusión de tipos jest-dom
  ]
}
```

**Propósito:**
- Garantizar que TypeScript incluya el archivo de declaración de tipos de jest-dom
- El archivo `jest.d.ts` contiene: `/// <reference types="@testing-library/jest-dom" />`

---

## 📊 Resumen de Cambios por Archivo

### LoanCard.test.tsx
| Línea | Cambio | Tipo |
|-------|--------|------|
| 2 | Remover `expect` de imports | Import fix |
| Total | 28 errores eliminados | `toBeInTheDocument` |

### Navbar.test.tsx
| Línea | Cambio | Tipo |
|-------|--------|------|
| 2 | Remover `expect` de imports | Import fix |
| 11 | Agregar `as any` a `jest.requireActual` | Type assertion |
| Total | 12 errores eliminados | `toBeInTheDocument` + spread |

### AdminLoans.test.tsx
| Línea | Cambio | Tipo |
|-------|--------|------|
| 30-65 | Cambiar IDs de `number` a `string` | Type correction |
| 30-65 | Cambiar `null` a `undefined` | Type correction |
| 30-65 | Reemplazar `userName` por estructura `user: { fullName, email }` | Schema fix |
| Total | 8 errores eliminados | Type mismatches |

### Login.test.tsx
| Línea | Cambio | Tipo |
|-------|--------|------|
| 2 | Remover `expect` de imports | Import fix |
| 16 | Agregar `as any` a `jest.requireActual` | Type assertion |
| 292 | Agregar `as any` a Promise mock | Type assertion |
| Total | 9 errores eliminados | Múltiples tipos |

### UserLoans.test.tsx
| Línea | Cambio | Tipo |
|-------|--------|------|
| 22 | Agregar `as any` a `jest.requireActual` | Type assertion |
| 30-52 | Cambiar IDs de `number` a `string` | Type correction |
| 30-52 | Cambiar `null` a `undefined` | Type correction |
| 30-52 | Reemplazar `userName` por estructura `user: { fullName, email }` | Schema fix |
| Total | 16 errores eliminados | Type mismatches |

---

## 🎯 Lecciones Aprendidas

### ✅ Buenas Prácticas Implementadas

1. **NO importar `expect` desde `@jest/globals`** cuando se usa `@testing-library/jest-dom`
   - Permite que jest-dom extienda correctamente los matchers globales

2. **Usar type assertions (`as any`)** en mocks complejos de Jest
   - Evita conflictos de tipos en estructuras mock que no coinciden exactamente con las originales

3. **Mantener consistencia entre interfaces y datos mock**
   - Los mocks deben respetar exactamente las interfaces TypeScript definidas
   - Usar `undefined` en lugar de `null` para campos opcionales sin valor

4. **Validar estructura de objetos anidados**
   - Asegurar que propiedades como `user: { fullName, email }` coincidan con la interfaz

5. **Incluir archivos de declaración en tsconfig**
   - Garantizar que `jest.d.ts` esté en la lista de includes para tipos globales

---

## 🔗 Referencias y Documentación

### Artículos relacionados
- [Jest + TypeScript: Type Assertion Best Practices](https://jestjs.io/docs/getting-started#using-typescript)
- [Testing Library + jest-dom Type Issues](https://github.com/testing-library/jest-dom/issues/123)
- [@jest/globals vs global scope](https://jestjs.io/docs/api#reference)

### Archivos clave del proyecto
- [`src/jest.d.ts`](../jest.d.ts) - Declaración de tipos jest-dom
- [`src/setupTests.ts`](../setupTests.ts) - Configuración global de tests
- [`tsconfig.test.json`](../../tsconfig.test.json) - Configuración TypeScript para tests
- [`src/types/Loan.ts`](../types/Loan.ts) - Interfaz del modelo Loan

---

## ✨ Resultado Final

### Antes
```
❌ 73 errores de TypeScript
❌ 5 archivos con alertas
❌ Compilación fallida
❌ Experiencia de desarrollo degradada
```

### Después
```
✅ 0 errores de TypeScript
✅ 5 archivos corregidos
✅ Compilación exitosa
✅ Experiencia de desarrollo fluida
✅ Tests ejecutándose sin warnings
```

---

## 🚀 Próximos Pasos

### Recomendaciones para evitar estos problemas en el futuro

1. **Documentar patrones de import** en la guía de contribución
   ```typescript
   // Patrón correcto para tests con jest-dom
   import { describe, it, jest } from '@jest/globals';
   import '@testing-library/jest-dom';
   // NO importar expect
   ```

2. **Crear snippet de VSCode** para nuevos archivos de test
   ```json
   {
     "Test Component": {
       "prefix": "testcomp",
       "body": [
         "import { render, screen } from '@testing-library/react';",
         "import { describe, it, jest, beforeEach } from '@jest/globals';",
         "import '@testing-library/jest-dom';",
         "",
         "describe('$1', () => {",
         "  it('$2', () => {",
         "    $0",
         "  });",
         "});"
       ]
     }
   }
   ```

3. **Agregar pre-commit hook** para validar tipos antes de commit
   ```bash
   # En el futuro con Husky (Fase 1.2)
   npm run type-check
   ```

4. **Actualizar TESTING.md** con sección de troubleshooting TypeScript

---

## 📝 Changelog

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2026-01-18 | 1.0.0 | Documento inicial - Corrección de 73 errores TypeScript |

---

**✅ Todos los archivos de test ahora compilan sin errores y están listos para desarrollo continuo.**
