/**
 * Componente de Prueba para Sentry
 * 
 * Este componente permite testear la integración de Sentry
 * sin afectar la aplicación en producción.
 * 
 * IMPORTANTE: Eliminar o comentar en producción
 */

import { Button, Paper, Typography, Box, Stack, Divider } from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import { captureError, captureMessage, addBreadcrumb } from '../config/sentry';
import api from '../api/axios';

function SentryTestComponent() {
  // Test 1: Error de React (capturado por ErrorBoundary)
  const testReactError = () => {
    throw new Error('🧪 Test de Sentry - Error de React');
  };

  // Test 2: Error HTTP (capturado por Axios interceptor)
  const testHttpError = async () => {
    try {
      await api.get('/test/nonexistent-endpoint-404');
    } catch {
      console.log('✅ Error HTTP capturado automáticamente en Sentry');
    }
  };

  // Test 3: Captura manual con contexto
  const testManualCapture = () => {
    try {
      // Simular error de cálculo
      const amount: unknown = null;
      const result = (amount as { toFixed: (decimals: number) => string }).toFixed(2); // ❌ Error
      console.log(result);
    } catch (error) {
      captureError(error, {
        context: 'Test Manual de Sentry',
        testType: 'Manual Capture',
        timestamp: new Date().toISOString(),
        customData: {
          amount: null,
          operation: 'toFixed'
        }
      });
      console.log('✅ Error capturado manualmente en Sentry con contexto');
    }
  };

  // Test 4: Breadcrumbs
  const testBreadcrumbs = () => {
    addBreadcrumb({
      category: 'test',
      message: '🧪 Breadcrumb 1 - Usuario hizo click',
      level: 'info',
      data: { button: 'test-breadcrumbs' }
    });

    setTimeout(() => {
      addBreadcrumb({
        category: 'test',
        message: '🧪 Breadcrumb 2 - Después de 1 segundo',
        level: 'info'
      });
    }, 1000);

    setTimeout(() => {
      addBreadcrumb({
        category: 'test',
        message: '🧪 Breadcrumb 3 - Justo antes del error',
        level: 'warning'
      });

      // Causar error para ver breadcrumbs
      throw new Error('🧪 Error después de breadcrumbs');
    }, 2000);

    console.log('✅ Breadcrumbs añadidos. Error en 2 segundos...');
  };

  // Test 5: Mensaje informativo (no error)
  const testCaptureMessage = () => {
    captureMessage('🧪 Test de Sentry - Mensaje Informativo', {
      level: 'info',
      extra: {
        testType: 'Capture Message',
        timestamp: new Date().toISOString()
      }
    });
    console.log('✅ Mensaje informativo enviado a Sentry');
  };

  // Test 6: Warning
  const testWarningMessage = () => {
    captureMessage('⚠️ Test de Sentry - Warning', {
      level: 'warning',
      extra: {
        testType: 'Warning Message',
        reason: 'Usuario intentó acción no permitida'
      }
    });
    console.log('✅ Warning enviado a Sentry');
  };

  return (
    <Paper elevation={3} sx={{ p: 3, m: 2, maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <BugReportIcon sx={{ fontSize: 60, color: 'error.main', mb: 1 }} />
        <Typography variant="h4" gutterBottom>
          🧪 Sentry Test Panel
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Componente de prueba para verificar integración de Sentry
        </Typography>
        <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 1 }}>
          ⚠️ Solo para desarrollo - Eliminar en producción
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Stack spacing={2}>
        {/* Test 1 */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            <strong>Test 1:</strong> Error de React (ErrorBoundary)
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Causa un error de React. Será capturado por ErrorBoundary y enviado a Sentry.
          </Typography>
          <Button
            variant="contained"
            color="error"
            onClick={testReactError}
            fullWidth
            startIcon={<BugReportIcon />}
          >
            Simular Error de React
          </Button>
        </Box>

        {/* Test 2 */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            <strong>Test 2:</strong> Error HTTP 404
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Hace petición HTTP a endpoint inexistente. Capturado por Axios interceptor.
          </Typography>
          <Button
            variant="contained"
            color="warning"
            onClick={testHttpError}
            fullWidth
          >
            Simular Error HTTP
          </Button>
        </Box>

        {/* Test 3 */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            <strong>Test 3:</strong> Captura Manual con Contexto
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Error capturado manualmente con metadata adicional.
          </Typography>
          <Button
            variant="contained"
            color="info"
            onClick={testManualCapture}
            fullWidth
          >
            Test Captura Manual
          </Button>
        </Box>

        {/* Test 4 */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            <strong>Test 4:</strong> Breadcrumbs
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Añade breadcrumbs y causa error. Verás los pasos previos en Sentry.
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            onClick={testBreadcrumbs}
            fullWidth
          >
            Test Breadcrumbs
          </Button>
        </Box>

        {/* Test 5 */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            <strong>Test 5:</strong> Mensaje Informativo
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Envía mensaje de log (no error) a Sentry.
          </Typography>
          <Button
            variant="outlined"
            color="info"
            onClick={testCaptureMessage}
            fullWidth
          >
            Test Mensaje Info
          </Button>
        </Box>

        {/* Test 6 */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            <strong>Test 6:</strong> Warning
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Envía warning a Sentry.
          </Typography>
          <Button
            variant="outlined"
            color="warning"
            onClick={testWarningMessage}
            fullWidth
          >
            Test Warning
          </Button>
        </Box>
      </Stack>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          <strong>Cómo verificar:</strong>
          <br />
          1. Ejecuta un test
          <br />
          2. Ve a <a href="https://sentry.io/" target="_blank" rel="noopener noreferrer">sentry.io</a>
          <br />
          3. Selecciona tu proyecto
          <br />
          4. En "Issues" verás los errores capturados
          <br />
          5. Click en un error para ver detalles completos
        </Typography>
      </Box>
    </Paper>
  );
}

export default SentryTestComponent;
