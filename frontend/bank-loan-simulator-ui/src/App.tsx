import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { PrivateRoute } from "./auth/PrivateRoute";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";

import Login from "./pages/Login";
import UserLoans from "./pages/UserLoans";
import RequestLoan from "./pages/RequestLoan";
import AdminLoans from "./pages/AdminLoans";

const theme = createTheme({
  palette: {  
    mode: 'light',
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
    </ThemeProvider>
  );
}

export default App;
