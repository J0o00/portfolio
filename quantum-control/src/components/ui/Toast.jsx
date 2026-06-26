import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, Loader2, X, RotateCcw } from 'lucide-react';

const ToastContext = createContext(null);

let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ type = 'info', message, duration = 4500, action }) => {
    const id = ++toastIdCounter;
    const newToast = { id, type, message, duration, action };
    setToasts((prev) => [...prev.slice(-4), newToast]); // Keep max 5 visible

    if (duration > 0 && type !== 'progress') {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const toast = {
    success: (msg, opts) => addToast({ type: 'success', message: msg, ...opts }),
    error: (msg, opts) => addToast({ type: 'error', message: msg, duration: 6000, ...opts }),
    warning: (msg, opts) => addToast({ type: 'warning', message: msg, ...opts }),
    info: (msg, opts) => addToast({ type: 'info', message: msg, ...opts }),
    progress: (msg, opts) => addToast({ type: 'progress', message: msg, duration: 0, ...opts }),
    dismiss: removeToast
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Container */}
      <div style={{
        position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 99999,
        display: 'flex', flexDirection: 'column', gap: '0.75rem', pointerEvents: 'none',
        maxWidth: '420px', width: 'calc(100% - 3rem)'
      }}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

function ToastItem({ toast, onDismiss }) {
  const getStyle = () => {
    switch (toast.type) {
      case 'success': return { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46', icon: <CheckCircle2 size={20} color="#10b981" /> };
      case 'error': return { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', icon: <AlertCircle size={20} color="#ef4444" /> };
      case 'warning': return { bg: '#fffbeb', border: '#fde68a', text: '#92400e', icon: <AlertTriangle size={20} color="#f59e0b" /> };
      case 'progress': return { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', icon: <Loader2 size={20} color="#3b82f6" className="spin" /> };
      default: return { bg: '#f8fafc', border: '#cbd5e1', text: '#1e293b', icon: <Info size={20} color="#64748b" /> };
    }
  };

  const st = getStyle();

  return (
    <div style={{
      pointerEvents: 'auto', background: st.bg, border: `1px solid ${st.border}`, color: st.text,
      padding: '0.85rem 1.25rem', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
      animation: 'toastSlideIn 0.25s ease-out forwards', fontSize: '0.9rem', fontWeight: 600
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
        {st.icon}
        <span style={{ lineHeight: 1.4 }}>{toast.message}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {toast.action && toast.action.label && (
          <button 
            onClick={() => { toast.action.onClick(); onDismiss(); }}
            style={{ 
              background: '#fff', border: `1px solid ${st.border}`, padding: '0.35rem 0.75rem', borderRadius: '6px',
              fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', color: st.text, display: 'flex', alignItems: 'center', gap: '0.3rem'
            }}
          >
            <RotateCcw size={14} /> {toast.action.label}
          </button>
        )}
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: st.text, opacity: 0.6, padding: '0.2rem' }}>
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
