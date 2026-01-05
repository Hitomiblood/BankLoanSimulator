import type { Loan, LoanStatus } from "../types/Loan";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Divider,
} from "@mui/material";

interface LoanCardProps {
  loan: Loan;
  showUser?: boolean;
}

function LoanCard({ loan, showUser = false }: LoanCardProps) {
  const getStatusColor = (status: LoanStatus) => {
    switch (status) {
      case LoanStatus.Pending:
        return "warning";
      case LoanStatus.Approved:
        return "success";
      case LoanStatus.Rejected:
        return "error";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: LoanStatus) => {
    switch (status) {
      case LoanStatus.Pending:
        return "Pendiente";
      case LoanStatus.Approved:
        return "Aprobado";
      case LoanStatus.Rejected:
        return "Rechazado";
      default:
        return "Desconocido";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" component="div">
            {formatCurrency(loan.amount)}
          </Typography>
          <Chip
            label={getStatusLabel(loan.status)}
            color={getStatusColor(loan.status)}
            size="small"
          />
        </Box>

        {showUser && loan.user && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Usuario:</strong> {loan.user.fullName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Email:</strong> {loan.user.email}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Tasa de interés:</strong> {loan.interestRate}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Plazo:</strong> {loan.termInMonths} meses
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Cuota mensual:</strong> {formatCurrency(loan.monthlyPayment)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Fecha solicitud:</strong> {formatDate(loan.requestDate)}
          </Typography>
        </Box>

        {loan.reviewDate && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary">
              <strong>Fecha revisión:</strong> {formatDate(loan.reviewDate)}
            </Typography>
          </>
        )}

        {loan.adminComments && (
          <Box sx={{ mt: 2, p: 1, bgcolor: "grey.100", borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Comentarios:</strong>
            </Typography>
            <Typography variant="body2">{loan.adminComments}</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default LoanCard;
