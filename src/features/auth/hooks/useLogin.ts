import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { loginSchema, type LoginFormValues } from '../types/auth.schema';
import { useAuth } from '../context/AuthContext';
import { paths } from '@/routes/paths';
import { extractApiErrorMessage } from '@/shared/utils/apiError';

/**
 * Encapsula toda la lógica del formulario de login:
 * - Validación de campos (react-hook-form + zod).
 * - Llamada a AuthContext.login (que a su vez habla con AuthService).
 * - Error de negocio del backend (`serverError`), separado de los errores
 *   de validación de campo que ya maneja react-hook-form internamente.
 */
export function useLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
      navigate(paths.dashboard);
    } catch (error) {
      setServerError(extractApiErrorMessage(error, 'Correo o contraseña incorrectos'));
    }
  });

  return {
    register: form.register,
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
    serverError,
    onSubmit,
  };
}
