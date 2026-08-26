import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useLogin } from '../hooks/useLogin';

/**
 * Vista pura: no conoce react-hook-form "por dentro" más allá de recibir
 * `register`/`errors` ya resueltos por el hook. Toda la orquestación vive
 * en useLogin — este componente solo presenta.
 */
export function LoginPage() {
  const { register, errors, isSubmitting, serverError, onSubmit } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        flexDirection: { xs: 'column', md: 'row' },
      }}
    >
      {/* Panel de marca */}
      <Box
        sx={{
          flex: { md: '0 0 44%' },
          minHeight: { xs: 220, md: '100vh' },
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: { xs: 4, md: 8 },
          color: '#fff',
          background:
            'linear-gradient(155deg, #004A98 0%, #00335F 55%, #001B33 100%)',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            width: 420,
            height: 420,
            borderRadius: '50%',
            background: 'rgba(0, 131, 193, 0.25)',
            top: -140,
            right: -140,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(103, 177, 227, 0.18)',
            bottom: -100,
            left: -80,
          }}
        />

        <Box />

        <Box sx={{ position: 'relative', maxWidth: 420 }}>
          <Typography variant="h3" sx={{ mb: 2, lineHeight: 1.25 }}>
            Estudios socioeconómicos, sin fricción.
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.85 }}>
            Digitaliza la captura de información de candidatos y da a tus
            analistas un expediente completo, ordenado y siempre disponible.
          </Typography>
        </Box>

        <Typography variant="caption" sx={{ position: 'relative', opacity: 0.6 }}>
          Powered by Domind
        </Typography>
      </Box>

      {/* Panel de formulario */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 4, sm: 6 },
          bgcolor: 'background.default',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Bienvenido de vuelta
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Ingresa tus credenciales para acceder al panel administrativo.
          </Typography>

          <Box component="form" onSubmit={onSubmit} noValidate>
            <Stack spacing={2.5}>
              {serverError && <Alert severity="error">{serverError}</Alert>}

              <TextField
                label="Correo electrónico"
                type="email"
                fullWidth
                autoComplete="email"
                error={!!errors.email}
                helperText={errors.email?.message}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlinedIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
                {...register('email')}
              />

              <TextField
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                autoComplete="current-password"
                error={!!errors.password}
                helperText={errors.password?.message}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((prev) => !prev)}
                          edge="end"
                          size="small"
                          aria-label="Mostrar u ocultar contraseña"
                        >
                          {showPassword ? (
                            <VisibilityOff fontSize="small" />
                          ) : (
                            <Visibility fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                {...register('password')}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isSubmitting}
                sx={{ py: 1.3, mt: 1 }}
              >
                {isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
