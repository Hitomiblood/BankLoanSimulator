import { useState, useEffect } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import LoanCard from "../components/LoanCard";
import type { Loan } from "../types/Loan";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";

function UserLoans() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const response = await api.get<Loan[]>("/loans/my-loans");
      setLoans(response.data);
      setError("");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Error al cargar los préstamos"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Navbar />
        <Container>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "80vh",
            }}
          >
            <CircularProgress />
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      <Container sx={{ mt: 4, pb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h4" component="h1">
            Mis Préstamos
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/request")}
          >
            Solicitar Préstamo
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loans.length === 0 ? (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No tienes préstamos solicitados
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Solicita tu primer préstamo para comenzar
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/request")}
            >
              Solicitar Préstamo
            </Button>
          </Box>
        ) : (
          <Box>
            {loans.map((loan) => (
              <LoanCard key={loan.id} loan={loan} />
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
}

export default UserLoans;
