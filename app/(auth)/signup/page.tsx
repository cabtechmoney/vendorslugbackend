'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { Container } from '@/components/shared/Container';
interface SignupFormData {
  email: string;
  password: string;
  shopName?: string;
  whatsappNumber?: string;
}
export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      await signup({
        email: data.email,
        password: data.password,
        shopName: data.shopName ?? '',
        whatsappNumber: data.whatsappNumber ?? '',
      });
      router.push('/login?verification=pending');
    } catch (err) {
      if(err instanceof Error)
      setError(err.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="min-h-screen flex items-center justify-center py-12">
      <AuthForm
        mode="signup"
        onSubmit={handleSubmit}
        isLoading={isLoading}
        error={error}
        onToggleMode={() => router.push('/login')}
      />
    </Container>
  );
}
