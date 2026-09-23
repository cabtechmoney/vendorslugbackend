'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { Container } from '@/components/shared/Container';
interface LoginFormData {
  email: string;
  password: string;
}
export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      await login(data.email, data.password);
      router.push('/admin/dashboard');
    } catch (err) {
      if (err instanceof Error)
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="min-h-screen flex items-center justify-center py-12">
      <AuthForm
        mode="login"
        onSubmit={handleSubmit}
        isLoading={isLoading}
        error={error}
        onToggleMode={() => router.push('/signup')}
      />
    </Container>
  );
}