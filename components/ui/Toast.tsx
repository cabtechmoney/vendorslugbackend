'use client';

import toast, { Toast } from 'react-hot-toast';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const showToast = {
  success: (message: string) =>
    toast.custom(
      (t:Toast) => (
        <div
          className={cn(
            'pointer-events-auto flex w-full max-w-md rounded-lg bg-emerald-50 p-4 shadow-lg dark:bg-emerald-900/30',
            'border border-emerald-200 dark:border-emerald-800'
          )}
        >
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
              {message}
            </p>
          </div>
          <button onClick={() => toast.dismiss(t.id)}>
            <X className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
          </button>
        </div>
      ),
      { duration: 4000 }
    ),
  error: (message: string) =>
    toast.custom(
      (t: Toast) => (
        <div
          className={cn(
            'pointer-events-auto flex w-full max-w-md rounded-lg bg-red-50 p-4 shadow-lg dark:bg-red-900/30',
            'border border-red-200 dark:border-red-800'
          )}
        >
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              {message}
            </p>
          </div>
          <button onClick={() => toast.dismiss(t.id)}>
            <X className="h-5 w-5 text-red-600 dark:text-red-300" />
          </button>
        </div>
      ),
      { duration: 4000 }
    ),
};