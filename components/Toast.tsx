import React, { useEffect } from 'react';
import { Toast as ToastType } from '../types';

interface ToastProps {
  toast: ToastType;
  onClose: (id: number) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const { id, message, type } = toast;

  const baseClasses = "flex items-center w-full max-w-xs p-4 space-x-4 rtl:space-x-reverse divide-x rtl:divide-x-reverse rounded-lg shadow-lg text-text-primary dark:text-text-primary-dark bg-surface dark:bg-surface-dark divide-border-color dark:divide-border-color-dark space-x";
  
  const typeClasses = {
    success: "text-green-500 dark:text-green-400",
    error: "text-red-500 dark:text-red-400",
  };

  const Icon = () => {
    if (type === 'success') {
      return (
        <svg className={`w-5 h-5 ${typeClasses.success}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>
        </svg>
      );
    }
    if (type === 'error') {
      return (
        <svg className={`w-5 h-5 ${typeClasses.error}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z"/>
        </svg>
      );
    }
    return null;
  };
  

  return (
    <div className={`${baseClasses} animate-fade-in`} role="alert">
      <div className="flex-shrink-0">
        <Icon />
      </div>
      <div className="ps-4 text-sm font-normal">{message}</div>
      <button 
        type="button" 
        className="ms-auto -mx-1.5 -my-1.5 p-1.5 inline-flex items-center justify-center h-8 w-8 text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg" 
        onClick={() => onClose(id)} 
        aria-label="Close"
      >
        <span className="sr-only">Close</span>
        <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
        </svg>
      </button>
    </div>
  );
};

export default Toast;
