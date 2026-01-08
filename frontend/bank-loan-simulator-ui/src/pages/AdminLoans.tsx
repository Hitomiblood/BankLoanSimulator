import { useState, useEffect } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import LoanCard from "../components/LoanCard";
import type { Loan, ReviewLoanRequest } from "../types/Loan";
import { LoanStatus } from "../types/Loan";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";

function AdminLoans() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [reviewStatus, setReviewStatus] = useState<LoanStatus>(LoanStatus.Approved);
  const [adminComments, setAdminComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const response = await api.get<Loan[]>("/loans");
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

  const handleOpenDialog = (loan: Loan) => {
    setSelectedLoan(loan);
    setReviewStatus(loan.status);
    setAdminComments(loan.adminComments || "");
  };

  const handleCloseDialog = () => {
    setSelectedLoan(null);
    setAdminComments("");
  };

  const handleReview = async () => {
    if (!selectedLoan) return;

    setSubmitting(true);
    try {
      const reviewData: ReviewLoanRequest = {
        status: reviewStatus,
        adminComments: adminComments || undefined,
      };

      await api.put(`/loans/${selectedLoan.id}/review`, reviewData);
      
      await fetchLoans();
      handleCloseDialog();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Error al revisar el préstamo"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = loans.filter((l) => l.status === 0).length;

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
      <Navbar isAdmin />
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
            Gestión de Préstamos
          </Typography>
          {pendingCount > 0 && (
            <Chip
              label={`${pendingCount} pendiente${pendingCount !== 1 ? "s" : ""}`}
              color="warning"
            />
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loans.length === 0 ? (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No hay préstamos registrados
            </Typography>
          </Box>
        ) : (
          <Box>
            {loans.map((loan) => (
              <Box key={loan.id}>
                <LoanCard loan={loan} showUser />
                <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleOpenDialog(loan)}
                  >
                    Revisar Préstamo
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* Dialog para revisar préstamo */}
        <Dialog
          open={selectedLoan !== null}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Revisar Préstamo</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={reviewStatus}
                  label="Estado"
                  onChange={(e) => setReviewStatus(e.target.value as LoanStatus)}
                >
                  <MenuItem value={0}>Pendiente</MenuItem>
                  <MenuItem value={1}>Aprobado</MenuItem>
                  <MenuItem value={2}>Rechazado</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Comentarios del administrador"
                multiline
                rows={4}
                value={adminComments}
                onChange={(e) => setAdminComments(e.target.value)}
                helperText="Opcional: añade comentarios sobre la decisión"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              onClick={handleReview}
              variant="contained"
              disabled={submitting}
            >
              {submitting ? "Guardando..." : "Guardar Revisión"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

export default AdminLoans;
