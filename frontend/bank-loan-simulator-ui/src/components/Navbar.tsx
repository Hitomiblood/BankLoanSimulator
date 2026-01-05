import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";

interface NavbarProps {
  isAdmin?: boolean;
}

function Navbar({ isAdmin = false }: NavbarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Bank Loan Simulator
        </Typography>

        <Box sx={{ display: "flex", gap: 2 }}>
          {isAdmin ? (
            <Button color="inherit" onClick={() => navigate("/admin")}>
              Gestionar Préstamos
            </Button>
          ) : (
            <>
              <Button color="inherit" onClick={() => navigate("/loans")}>
                Mis Préstamos
              </Button>
              <Button color="inherit" onClick={() => navigate("/request")}>
                Solicitar Préstamo
              </Button>
            </>
          )}

          <Button
            color="inherit"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
          >
            Salir
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
