import { toast } from 'sonner';

export function notifySuccess(message: string): void {
  toast.success(message);
}

export function notifyError(message: string, error?: unknown): void {
  if (error) console.error(error);
  toast.error(message);
}

export function notifyLoading(message: string): string | number {
  return toast.loading(message);
}

export function notifyDismiss(id: string | number): void {
  toast.dismiss(id);
}

