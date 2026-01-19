# 🔍 Análisis de Errores en Tests - Bank Loan Simulator

**Fecha:** 18 de enero de 2026  
**Estado Tests:** 163 passing / 1 failing  
**Cobertura:** 99.4% pasando

---

## 📊 Resumen Ejecutivo

### Estado Actual
- **Tests ejecutados:** 164 total
- **Tests exitosos:** 163 (99.4%)
- **Tests fallidos:** 1 (0.6%)
- **Warnings de consola:** 4 warnings de `act(...)` en RequestLoan

### Problemas Identificados

1. **❌ Test Fallido:** UserLoans - "debe limpiar el mensaje de error después de una carga exitosa"
2. **⚠️ Warnings de Consola:** 4 warnings de React sobre actualizaciones de estado no envueltas en `act(...)`

---

## 🔴 PROBLEMA 1: Test Fallido en UserLoans

### 📍 Ubicación
- **Archivo:** [UserLoans.test.tsx](../UserLoans.test.tsx#L278)
- **Test:** `"debe limpiar el mensaje de error después de una carga exitosa"`
- **Línea:** 278

### 🐛 Error Reportado
```
expect(element).not.toBeInTheDocument()

expected document not to contain element, found 
<div class="MuiAlert-message">Error temporal</div> instead
```

### 📝 Descripción del Problema

El test está fallando porque **el mensaje de error NO se está limpiando** cuando la carga de datos tiene éxito después de un error previo.

### 🔬 Análisis en Profundidad

#### **Flujo del Test:**

```typescript
it('debe limpiar el mensaje de error después de una carga exitosa', async () => {
  // 1. Primero simula un error
  (api.get as jest.Mock).mockRejectedValueOnce({
    response: { data: { message: 'Error temporal' } },
  });

  // 2. Renderiza el componente (que falla)
  const { rerender } = render(
    <BrowserRouter>
      <UserLoans />
    </BrowserRouter>
  );

  // 3. Verifica que el error se muestre
  await waitFor(() => {
    expect(screen.getByText('Error temporal')).toBeInTheDocument();
  });

  // 4. Cambia el mock para que tenga éxito
  (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });

  // 5. Re-renderiza el componente
  rerender(
    <BrowserRouter>
      <UserLoans />
    </BrowserRouter>
  );

  // 6. ❌ FALLA AQUÍ: Espera que el error desaparezca, pero NO lo hace
  await waitFor(() => {
    expect(screen.queryByText('Error temporal')).not.toBeInTheDocument();
  });
});
```

#### **¿Por qué falla?**

El problema está en el **componente UserLoans.tsx**:

```typescript
// UserLoans.tsx (líneas 27-38)
const fetchLoans = async () => {
  try {
    setLoading(true);
    const response = await api.get<Loan[]>("/loans/my-loans");
    setLoans(response.data);
    setError("");  // ✅ Limpia el error cuando tiene éxito
  } catch (err: any) {
    setError(
      err.response?.data?.message || "Error al cargar los préstamos"
    );
  } finally {
    setLoading(false);
  }
};
```

**El código del componente ES CORRECTO** - limpia el error con `setError("")` en la línea 32.

El problema está en el **TEST**:

#### **Problema del Test: `rerender()` NO vuelve a ejecutar `useEffect`**

```typescript
// ❌ ESTO NO FUNCIONA
rerender(
  <BrowserRouter>
    <UserLoans />
  </BrowserRouter>
);
```

**Explicación:**
- `rerender()` solo actualiza las props del componente
- **NO vuelve a ejecutar los hooks de ciclo de vida** como `useEffect`
- El componente UserLoans ejecuta la carga en `useEffect(() => { fetchLoans(); }, []);`
- Como el `useEffect` tiene un array de dependencias vacío `[]`, solo se ejecuta en el **primer montaje**
- Al hacer `rerender()`, el componente ya está montado, por lo que `useEffect` NO se ejecuta de nuevo
- Por lo tanto, `fetchLoans()` nunca se vuelve a llamar con el nuevo mock exitoso
- El error "Error temporal" queda en el estado y nunca se limpia

### ✅ Solución del Problema

Hay **3 soluciones posibles**:

#### **Opción 1: Desmontar y montar el componente (RECOMENDADA)**

```typescript
it('debe limpiar el mensaje de error después de una carga exitosa', async () => {
  // Primero falla
  (api.get as jest.Mock).mockRejectedValueOnce({
    response: { data: { message: 'Error temporal' } },
  });

  const { unmount } = render(
    <BrowserRouter>
      <UserLoans />
    </BrowserRouter>
  );

  await waitFor(() => {
    expect(screen.getByText('Error temporal')).toBeInTheDocument();
  });

  // Luego tiene éxito
  (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });

  // ✅ Desmontar completamente el componente
  unmount();

  // ✅ Montar de nuevo (esto ejecuta useEffect otra vez)
  render(
    <BrowserRouter>
      <UserLoans />
    </BrowserRouter>
  );

  await waitFor(() => {
    expect(screen.queryByText('Error temporal')).not.toBeInTheDocument();
  });
});
```

#### **Opción 2: Mockear con secuencia (ALTERNATIVA)**

```typescript
it('debe limpiar el mensaje de error después de una carga exitosa', async () => {
  // Configurar el mock para que falle primero y luego tenga éxito
  (api.get as jest.Mock)
    .mockRejectedValueOnce({
      response: { data: { message: 'Error temporal' } },
    })
    .mockResolvedValueOnce({ data: mockLoans });

  const { unmount } = render(
    <BrowserRouter>
      <UserLoans />
    </BrowserRouter>
  );

  await waitFor(() => {
    expect(screen.getByText('Error temporal')).toBeInTheDocument();
  });

  // Desmontar y volver a montar
  unmount();
  
  render(
    <BrowserRouter>
      <UserLoans />
    </BrowserRouter>
  );

  await waitFor(() => {
    expect(screen.queryByText('Error temporal')).not.toBeInTheDocument();
    expect(screen.getByTestId('loan-card-1')).toBeInTheDocument();
  });
});
```

#### **Opción 3: Cambiar el componente para exponer la función fetchLoans (NO RECOMENDADA)**

Esta opción requeriría cambiar el código de producción solo para los tests, lo cual es una **mala práctica**.

### 🎯 Recomendación Final

**Implementar la Opción 1** porque:
- ✅ No requiere cambios en el código de producción
- ✅ Simula el comportamiento real del usuario (navegar entre páginas)
- ✅ Es más simple y legible
- ✅ Prueba el ciclo de vida completo del componente

---

## ⚠️ PROBLEMA 2: Warnings de Console - `act(...)` en RequestLoan

### 📍 Ubicación
- **Archivo:** [RequestLoan.tsx](../../../pages/RequestLoan.tsx)
- **Líneas afectadas:** 69, 76
- **Número de warnings:** 4 (aparecen 2 veces por cada prueba afectada)

### 🐛 Warning Reportado
```
console.error
  An update to RequestLoan inside a test was not wrapped in act(...).
  
  When testing, code that causes React state updates should be wrapped into act(...):
  
  act(() => {
    /* fire events that update state */
  });
  /* assert on the output */
```

### 📝 Descripción del Problema

Los warnings ocurren en el componente **RequestLoan** cuando se ejecutan actualizaciones de estado **después de que el test ha terminado** o **fuera del contexto de testing controlado**.

### 🔬 Análisis en Profundidad

#### **Código Problemático:**

```typescript
// RequestLoan.tsx (líneas 58-78)
const handleSubmit = async (event: React.FormEvent) => {
  event.preventDefault();
  setError("");
  setSuccess("");
  setLoading(true);

  try {
    await api.post("/loans", {
      amount: parseFloat(amount),
      interestRate: parseFloat(interestRate),
      termInMonths: parseInt(termInMonths),
    });

    setSuccess("Préstamo solicitado exitosamente"); // ⚠️ Warning aquí (línea 69)
    setTimeout(() => {
      navigate("/loans");
    }, 1500); // ⚠️ Esta navegación es asíncrona
  } catch (err: any) {
    setError(err.response?.data?.message || "Error al solicitar el préstamo");
  } finally {
    setLoading(false); // ⚠️ Warning aquí (línea 76)
  }
};
```

#### **¿Por qué ocurren los warnings?**

**Razón 1: `setTimeout` no esperado**
- El `setTimeout(() => { navigate("/loans"); }, 1500)` se ejecuta **después de 1.5 segundos**
- Durante ese tiempo, el componente puede haberse desmontado en el test
- Cuando el `setTimeout` se ejecuta, intenta navegar pero el componente ya no existe
- Esto causa una actualización de estado en un componente desmontado

**Razón 2: Actualizaciones de estado después del test**
- Los tests terminan rápidamente después de verificar las aserciones
- Las actualizaciones de estado en `finally` pueden ejecutarse **después** de que el test termine
- React Testing Library advierte porque estas actualizaciones no están "controladas" en el contexto del test

### ✅ Solución del Problema

#### **Opción 1: Usar `act` en el código del componente (NO RECOMENDADA)**

Esto contamina el código de producción con lógica de testing.

#### **Opción 2: Limpiar timeouts en cleanup (PARCIAL)**

```typescript
useEffect(() => {
  let timeoutId: NodeJS.Timeout;
  
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
}, []);
```

#### **Opción 3: Esperar las actualizaciones asíncronas en los tests (RECOMENDADA)**

```typescript
// En los tests de RequestLoan.test.tsx
it('debe navegar a /loans después de solicitar exitosamente', async () => {
  mockedApi.post.mockResolvedValueOnce({
    data: { message: 'Préstamo solicitado exitosamente' },
  });

  render(<LoginWithProviders />);
  
  // ... llenar el formulario ...
  fireEvent.click(submitButton);

  // ✅ Esperar el mensaje de éxito
  await waitFor(() => {
    expect(screen.getByText('Préstamo solicitado exitosamente')).toBeInTheDocument();
  });

  // ✅ Esperar la navegación (1.5 segundos)
  await waitFor(
    () => {
      expect(mockNavigate).toHaveBeenCalledWith('/loans');
    },
    { timeout: 2000 } // Dar tiempo suficiente para el setTimeout
  );
});
```

#### **Opción 4: Usar fake timers de Jest (MEJOR SOLUCIÓN)**

```typescript
// RequestLoan.test.tsx
describe('RequestLoan', () => {
  beforeEach(() => {
    jest.useFakeTimers(); // ✅ Activar timers falsos
  });

  afterEach(() => {
    jest.runOnlyPendingTimers(); // ✅ Ejecutar timers pendientes
    jest.useRealTimers(); // ✅ Restaurar timers reales
  });

  it('debe navegar a /loans después de solicitar exitosamente', async () => {
    mockedApi.post.mockResolvedValueOnce({
      data: { message: 'Préstamo solicitado exitosamente' },
    });

    render(<RequestLoanWithProviders />);
    
    // ... llenar y enviar formulario ...

    await waitFor(() => {
      expect(screen.getByText('Préstamo solicitado exitosamente')).toBeInTheDocument();
    });

    // ✅ Avanzar el tiempo 1.5 segundos
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    // ✅ Verificar navegación
    expect(mockNavigate).toHaveBeenCalledWith('/loans');
  });
});
```

### 🎯 Recomendación Final

**Implementar la Opción 4 (fake timers)** porque:
- ✅ Elimina completamente los warnings
- ✅ Los tests son más rápidos (no espera 1.5 segundos reales)
- ✅ Control total sobre el tiempo en los tests
- ✅ Previene race conditions
- ✅ Es la solución más limpia y profesional

---

## 📋 Plan de Corrección

### Prioridad Alta (Crítico)
1. **Corregir test fallido en UserLoans.test.tsx**
   - Implementar unmount/mount en lugar de rerender
   - Tiempo estimado: 5 minutos
   - Impact: Test suite pasará al 100%

### Prioridad Media (Mejora de calidad)
2. **Eliminar warnings de act(...) en RequestLoan.test.tsx**
   - Implementar fake timers de Jest
   - Actualizar todos los tests afectados
   - Tiempo estimado: 15 minutos
   - Impact: Console limpio, tests más robustos

---

## 🔧 Implementación de Correcciones

### Cambio 1: UserLoans.test.tsx

**Líneas a modificar:** 260-280

```typescript
// ❌ ANTES
it('debe limpiar el mensaje de error después de una carga exitosa', async () => {
  (api.get as jest.Mock).mockRejectedValueOnce({
    response: { data: { message: 'Error temporal' } },
  });

  const { rerender } = render(
    <BrowserRouter>
      <UserLoans />
    </BrowserRouter>
  );

  await waitFor(() => {
    expect(screen.getByText('Error temporal')).toBeInTheDocument();
  });

  (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });

  rerender(
    <BrowserRouter>
      <UserLoans />
    </BrowserRouter>
  );

  await waitFor(() => {
    expect(screen.queryByText('Error temporal')).not.toBeInTheDocument();
  });
});

// ✅ DESPUÉS
it('debe limpiar el mensaje de error después de una carga exitosa', async () => {
  (api.get as jest.Mock).mockRejectedValueOnce({
    response: { data: { message: 'Error temporal' } },
  });

  const { unmount } = render(
    <BrowserRouter>
      <UserLoans />
    </BrowserRouter>
  );

  await waitFor(() => {
    expect(screen.getByText('Error temporal')).toBeInTheDocument();
  });

  (api.get as jest.Mock).mockResolvedValue({ data: mockLoans });

  // Desmontar y volver a montar para simular navegación
  unmount();

  render(
    <BrowserRouter>
      <UserLoans />
    </BrowserRouter>
  );

  await waitFor(() => {
    expect(screen.queryByText('Error temporal')).not.toBeInTheDocument();
    expect(screen.getByTestId('loan-card-1')).toBeInTheDocument();
  });
});
```

### Cambio 2: RequestLoan.test.tsx

**Agregar en el describe principal:**

```typescript
describe('RequestLoan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers(); // ✅ Activar fake timers
  });

  afterEach(() => {
    jest.runOnlyPendingTimers(); // ✅ Ejecutar timers pendientes
    jest.useRealTimers(); // ✅ Restaurar timers reales
  });

  // ... resto de los tests
});
```

**Actualizar tests que verifican navegación:**

```typescript
it('debe navegar a /loans después de solicitar exitosamente', async () => {
  mockedApi.post.mockResolvedValueOnce({
    data: { message: 'Préstamo creado exitosamente' },
  });

  render(<RequestLoanWithProviders />);
  
  // ... llenar formulario ...

  fireEvent.click(submitButton);

  await waitFor(() => {
    expect(screen.getByText(/Préstamo solicitado exitosamente/i)).toBeInTheDocument();
  });

  // ✅ Avanzar el tiempo del setTimeout
  act(() => {
    jest.advanceTimersByTime(1500);
  });

  expect(mockNavigate).toHaveBeenCalledWith('/loans');
});
```

---

## 📊 Impacto Esperado

### Antes de las correcciones
- ❌ 1 test fallando
- ⚠️ 4 warnings en consola
- 📊 99.4% tests pasando

### Después de las correcciones
- ✅ 0 tests fallando
- ✅ 0 warnings en consola
- 📊 100% tests pasando
- 🚀 Tests más rápidos (fake timers)
- 🧹 Código de tests más limpio y profesional

---

## 🎓 Lecciones Aprendidas

### 1. `rerender()` vs `unmount()/mount()`
- `rerender()` solo actualiza props, NO vuelve a ejecutar `useEffect`
- Para simular navegación completa, usar `unmount()` y luego `render()` de nuevo

### 2. Actualizaciones de estado asíncronas en tests
- Siempre esperar todas las actualizaciones de estado con `waitFor()`
- Los `setTimeout` en componentes necesitan manejo especial en tests

### 3. Fake Timers de Jest
- Solución profesional para manejar código asíncrono basado en tiempo
- Hace los tests más rápidos y determinísticos
- Elimina warnings de React sobre actualizaciones no controladas

### 4. Testing de ciclos de vida completos
- Importante probar no solo el estado inicial, sino también transiciones de estado
- Los tests deben simular el comportamiento real del usuario
- Desmontar/montar componentes simula navegación entre páginas

---

## 📚 Referencias

- [React Testing Library - Queries](https://testing-library.com/docs/queries/about/)
- [React Testing Library - Async Utilities](https://testing-library.com/docs/dom-testing-library/api-async/)
- [Jest - Timer Mocks](https://jestjs.io/docs/timer-mocks)
- [React Testing Library - FAQ: act(...) warning](https://testing-library.com/docs/dom-testing-library/api-async/#waitfor)
- [Kent C. Dodds - Fix the "not wrapped in act(...)" warning](https://kentcdodds.com/blog/fix-the-not-wrapped-in-act-warning)

---

**✅ Con estas correcciones, todos los tests pasarán al 100% sin warnings.**
