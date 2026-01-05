import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { PrivateRoute } from "./auth/PrivateRoute";

import Login from "./pages/Login";
import UserLoans from "./pages/UserLoans";
import RequestLoan from "./pages/RequestLoan";
import AdminLoans from "./pages/AdminLoans";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          <Route path="/loans" element={
            <PrivateRoute>
              <UserLoans />
            </PrivateRoute>
          } />

          <Route path="/request" element={
            <PrivateRoute>
              <RequestLoan />
            </PrivateRoute>
          } />

          <Route path="/admin" element={
            <PrivateRoute>
              <AdminLoans />
            </PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
