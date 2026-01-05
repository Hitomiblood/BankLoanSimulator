import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import type { CalculatePaymentResponse } from "../types/Loan";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Alert,
  InputAdornment,
  Divider,
} from "@mui/material";
import CalculateIcon from "@mui/icons-material/Calculate";
import SendIcon from "@mui/icons-material/Send";

function RequestLoan() {
  const [amount, setAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [termInMonths, setTermInMonths] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCalculate = async () => {
    setError("");
    setMonthlyPayment(null);

    if (!amount || !interestRate || !termInMonths) {
      setError("Por favor completa todos los campos");
      return;
    }

    try {
      const response = await api.post<CalculatePaymentResponse>(
        "/loans/calculate",
        {
          amount: parseFloat(amount),
          interestRate: parseFloat(interestRate),
          termInMonths: parseInt(termInMonths),
        }
      );
      setMonthlyPayment(response.data.monthlyPayment);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Error al calcular la cuota mensual"
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.post("/loans", {
        amount: parseFloat(amount),
        interestRate: parseFloat(interestRate),
        termInMonths: parseInt(termInMonths),
      });

      setSuccess("Préstamo solicitado exitosamente");
      setTimeout(() => {
        navigate("/loans");
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al solicitar el préstamo");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Solicitar Préstamo
        </Typography>

        <Paper elevation={3} sx={{ p: 4, mt: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Monto del préstamo"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">€</InputAdornment>
                ),
              }}
              helperText="Monto entre €1,000 y €1,000,000"
              sx={{ mb: 3 }}
              required
            />

            <TextField
              fullWidth
              label="Tasa de interés anual"
              type="number"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">%</InputAdornment>,
              }}
              helperText="Tasa entre 0% y 50%"
              sx={{ mb: 3 }}
              required
            />

            <TextField
              fullWidth
              label="Plazo en meses"
              type="number"
              value={termInMonths}
              onChange={(e) => setTermInMonths(e.target.value)}
              helperText="Plazo entre 1 y 360 meses"
              sx={{ mb: 3 }}
              required
            />

            <Button
              fullWidth
              variant="outlined"
              startIcon={<CalculateIcon />}
              onClick={handleCalculate}
              sx={{ mb: 3 }}
            >
              Calcular Cuota Mensual
            </Button>

            {monthlyPayment !== null && (
              <Box
                sx={{
                  mb: 3,
                  p: 3,
                  bgcolor: "primary.light",
                  color: "primary.contrastText",
                  borderRadius: 2,
                  textAlign: "center",
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Cuota Mensual Estimada
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(monthlyPayment)}
                </Typography>
              </Box>
            )}

            <Divider sx={{ mb: 3 }} />

            <Button
              fullWidth
              variant="contained"
              type="submit"
              startIcon={<SendIcon />}
              disabled={loading}
              size="large"
            >
              {loading ? "Enviando..." : "Solicitar Préstamo"}
            </Button>
          </Box>
        </Paper>

        <Box sx={{ mt: 3, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Importante:</strong> La solicitud será revisada por un
            administrador. Recibirás una respuesta en los próximos días hábiles.
          </Typography>
        </Box>
      </Container>
    </>
  );
}

export default RequestLoan;
