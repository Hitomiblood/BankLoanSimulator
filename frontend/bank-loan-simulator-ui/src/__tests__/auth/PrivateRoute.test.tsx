import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PrivateRoute } from '../../auth/PrivateRoute';
import { AuthProvider } from '../../auth/AuthContext';

describe('PrivateRoute', () => {
  const MockProtectedComponent = () => <div>Protected Content</div>;
  const MockLoginComponent = () => <div>Login Page</div>;

  const renderWithRouter = (token: string | null) => {
    // Simular localStorage
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }

    return render(
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<MockLoginComponent />} />
            <Route
              path="/protected"
              element={
                <PrivateRoute>
                  <MockProtectedComponent />
                </PrivateRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    );
  };

  beforeEach(() => {
    localStorage.clear();
  });

  describe('Autenticación exitosa', () => {
    it('debe renderizar el componente hijo cuando hay token', () => {
      window.history.pushState({}, 'Test page', '/protected');
      renderWithRouter('valid-token-123');

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('debe permitir acceso con diferentes tokens válidos', () => {
      window.history.pushState({}, 'Test page', '/protected');
      renderWithRouter('another-valid-token');

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('debe permitir acceso con tokens largos', () => {
      window.history.pushState({}, 'Test page', '/protected');
      const longToken = 'a'.repeat(500);
      renderWithRouter(longToken);

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Autenticación fallida', () => {
    it('debe redirigir a /login cuando no hay token', () => {
      window.history.pushState({}, 'Test page', '/protected');
      renderWithRouter(null);

      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('no debe mostrar el contenido protegido sin token', () => {
      window.history.pushState({}, 'Test page', '/protected');
      renderWithRouter(null);

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Persistencia de autenticación', () => {
    it('debe mantener el acceso si el token está en localStorage', () => {
      localStorage.setItem('token', 'persistent-token');

      window.history.pushState({}, 'Test page', '/protected');

      render(
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<MockLoginComponent />} />
              <Route
                path="/protected"
                element={
                  <PrivateRoute>
                    <MockProtectedComponent />
                  </PrivateRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('debe denegar acceso si no hay token en localStorage', () => {
      localStorage.clear();

      window.history.pushState({}, 'Test page', '/protected');

      render(
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<MockLoginComponent />} />
              <Route
                path="/protected"
                element={
                  <PrivateRoute>
                    <MockProtectedComponent />
                  </PrivateRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  describe('Múltiples rutas protegidas', () => {
    it('debe proteger múltiples rutas con el mismo componente', () => {
      localStorage.setItem('token', 'valid-token');
      window.history.pushState({}, 'Test', '/protected');

      render(
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<MockLoginComponent />} />
              <Route
                path="/protected"
                element={
                  <PrivateRoute>
                    <MockProtectedComponent />
                  </PrivateRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Tipos de componentes hijos', () => {
    it('debe renderizar componentes funcionales', () => {
      window.history.pushState({}, 'Test page', '/protected');
      renderWithRouter('valid-token');

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('debe renderizar elementos JSX complejos', () => {
      const ComplexComponent = () => (
        <div>
          <h1>Title</h1>
          <p>Description</p>
          <button>Action</button>
        </div>
      );

      localStorage.setItem('token', 'valid-token');
      window.history.pushState({}, 'Test page', '/protected');

      render(
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<MockLoginComponent />} />
              <Route
                path="/protected"
                element={
                  <PrivateRoute>
                    <ComplexComponent />
                  </PrivateRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
    });
  });

  describe('Transiciones de estado', () => {
    it('debe proteger rutas correctamente con token', () => {
      localStorage.setItem('token', 'valid-token');
      window.history.pushState({}, 'Test page', '/protected');

      render(
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<MockLoginComponent />} />
              <Route
                path="/protected"
                element={
                  <PrivateRoute>
                    <MockProtectedComponent />
                  </PrivateRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Casos edge', () => {
    it('debe redirigir cuando el token es vacío', () => {
      window.history.pushState({}, 'Test page', '/protected');
      renderWithRouter(''); // Token vacío

      // Token vacío debe redirigir a login
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('debe manejar tokens con espacios', () => {
      window.history.pushState({}, 'Test page', '/protected');
      renderWithRouter('   token-with-spaces   ');

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('debe manejar tokens con caracteres especiales', () => {
      window.history.pushState({}, 'Test page', '/protected');
      renderWithRouter('token-with-special-chars-!@#$%^&*()');

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });
});
