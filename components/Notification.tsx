
import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Auto-dismiss after 4 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === 'success';

  return (
    <div className={`fixed top-5 right-5 z-[200] w-full max-w-sm p-4 rounded-2xl shadow-2xl border flex items-start gap-4 animate-fade-in-down
      ${isSuccess 
        ? 'bg-emerald-600 border-emerald-500 text-white' 
        : 'bg-red-600 border-red-500 text-white'}`
    }>
      <div className="shrink-0 pt-1">
        {isSuccess ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
      </div>
      <div className="flex-1">
        <p className="font-black text-sm">{isSuccess ? 'Éxito' : 'Error'}</p>
        <p className="text-xs mt-1">{message}</p>
      </div>
      <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 transition-colors">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};
