import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { PrivateRoute } from "./auth/PrivateRoute";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ErrorBoundary from "./components/ErrorBoundary";
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
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastContainer 
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
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
    </ErrorBoundary>
  );
}

export default App;
