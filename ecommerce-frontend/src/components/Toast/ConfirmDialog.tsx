// src/components/Toast/ConfirmDialog.tsx
import { createContext, useCallback, useContext, useState } from 'react';
import styles from './ConfirmDialog.module.css';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}

interface ConfirmState extends ConfirmOptions {
  id: number;
  resolve: (value: boolean) => void;
}

interface ConfirmFn {
  (options: ConfirmOptions): Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmFn | null>(null);

let confirmId = 0;

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [confirms, setConfirms] = useState<ConfirmState[]>([]);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      const id = ++confirmId;
      setConfirms(prev => [...prev, { ...options, id, resolve }]);
    });
  }, []);

  const handleClose = (id: number, result: boolean) => {
    const item = confirms.find(c => c.id === id);
    if (item) item.resolve(result);
    setConfirms(prev => prev.filter(c => c.id !== id));
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {confirms.map(c => (
        <div key={c.id} className={styles.overlay} onClick={() => handleClose(c.id, false)}>
          <div className={styles.dialog} onClick={e => e.stopPropagation()}>
            <div className={styles.header}>
              <h6 className={styles.title}>{c.title || '确认操作'}</h6>
              <button className={styles.close} onClick={() => handleClose(c.id, false)}>
                <i className="bi bi-x" />
              </button>
            </div>
            <p className={styles.message}>{c.message}</p>
            <div className={styles.actions}>
              <button
                className={`btn btn-sm btn-outline-secondary ${styles.btn}`}
                onClick={() => handleClose(c.id, false)}
              >
                {c.cancelText || '取消'}
              </button>
              <button
                className={`btn btn-sm btn-${c.variant || 'danger'} ${styles.btn}`}
                onClick={() => handleClose(c.id, true)}
              >
                {c.confirmText || '确定'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
