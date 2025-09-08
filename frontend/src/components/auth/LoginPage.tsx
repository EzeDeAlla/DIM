import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { z } from 'zod';
import { loginSchema as LoginSchema } from '../chat/schema';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";


const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading, error: authError } = useAuth();
  const [showPassword, setShowPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const validateForm = () => {
    try {
      LoginSchema.parse(formData);
      setValidationErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach(issue => {
          if (issue.path[0]) {
            errors[issue.path[0].toString()] = issue.message;
          }
        });
        setValidationErrors(errors);
      }
      return false;
    }
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await login(formData.email, formData.password);
      navigate('/app');
    } catch (error) {
      // The authError from useAuth will be used to display login errors.
      console.error('Login error:', error);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-muted p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-md shadow-lg border-border/50 mx-4 sm:mx-0">
        <CardHeader className="text-center p-6 sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <span className="text-3xl" role="img" aria-label="Medical Icon">🩺</span>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold">Mensajería Médica</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Ingresá a tu cuenta para acceder al sistema
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 sm:p-8">
          {authError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleChange}
                aria-invalid={!!validationErrors.email}
              />
              {validationErrors.email && (
                <p className="text-sm text-destructive">
                  {validationErrors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Tu contraseña"
                  value={formData.password}
                  onChange={handleChange}
                  aria-invalid={!!validationErrors.password}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                   <span className="text-sm text-muted-foreground" aria-hidden="true">
                    {showPassword ? "👁️" : "🙈"}
                  </span>
                </Button>
              </div>
              {validationErrors.password && (
                <p className="text-sm text-destructive">
                  {validationErrors.password}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            ¿Problemas para acceder?{" "}
            <Button variant="link" className="p-0 h-auto">
              Contactá al administrador
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;