import React from 'react';
import Toast from './Toast';
import { Toast as ToastType } from '../types';

interface ToastContainerProps {
  toasts: ToastType[];
  setToasts: React.Dispatch<React.SetStateAction<ToastType[]>>;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, setToasts }) => {
  const handleClose = (id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  return (
    <div className="fixed top-24 right-0 sm:right-5 z-50 p-4 space-y-4 w-full sm:w-auto">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={handleClose} />
      ))}
    </div>
  );
};

export default ToastContainer;
