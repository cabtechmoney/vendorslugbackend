'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Store, Phone, Sparkles, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import type { LoginData, SignupData } from '@/types';

type AuthFormData = LoginData & Partial<Pick<SignupData, 'shopName' | 'whatsappNumber'>>;
interface AuthFormProps {
  mode: 'login' | 'signup';
  onSubmit: (data: AuthFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  onToggleMode: () => void;
}

export function AuthForm({
  mode,
  onSubmit,
  isLoading,
  error,
  onToggleMode,
}: AuthFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    shopName: '',
    whatsappNumber: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full max-w-md border-0 bg-card/50 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-2">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-primary">Vendor Core</span>
          </div>
          <CardTitle className="text-3xl font-bold">
            {mode === 'login' ? 'Welcome Back' : 'Create Your Store'}
          </CardTitle>
          <CardDescription>
            {mode === 'login'
              ? 'Enter your credentials to access your dashboard'
              : "Start selling with Nigeria's fastest growing thrift marketplace"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <Input
                  label="Shop Name"
                  placeholder="e.g., Yaba Vintage Collection"
                  icon={<Store className="h-4 w-4" />}
                  value={formData.shopName}
                  onChange={(e) =>
                    setFormData({ ...formData, shopName: e.target.value })
                  }
                  required
                />
                <Input
                  label="WhatsApp Number"
                  placeholder="e.g., +2348012345678"
                  icon={<Phone className="h-4 w-4" />}
                  value={formData.whatsappNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsappNumber: e.target.value })
                  }
                  required
                />
              </>
            )}

            <Input
              type="email"
              label="Email Address"
              placeholder="merchant@example.com"
              icon={<Mail className="h-4 w-4" />}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="••••••••"
                icon={<Lock className="h-4 w-4" />}
                iconPosition="left"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm text-destructive"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              {mode === 'login' ? 'Access Dashboard' : 'Create Account'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={onToggleMode}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {mode === 'login'
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Log in'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
