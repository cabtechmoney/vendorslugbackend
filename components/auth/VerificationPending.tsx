'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Mail } from 'lucide-react';

interface VerificationPendingProps {
  email: string;
  onResend?: () => void;
  onBack?: () => void;
}

export function VerificationPending({
  email,
  onResend,
  onBack,
}: VerificationPendingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full max-w-md border-0 bg-card/50 backdrop-blur-xl shadow-2xl p-6 text-center space-y-6">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-2xl flex items-center justify-center rounded-full mx-auto">
          <Mail className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Check Your Email</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We have sent a verification link to{' '}
            <span className="font-semibold text-primary">{email}</span>.
            Click the link to activate your account.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {onResend && (
            <Button variant="outline" onClick={onResend} className="w-full">
              Resend Email
            </Button>
          )}
          {onBack && (
            <Button variant="ghost" onClick={onBack} className="w-full">
              Back to Login
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}