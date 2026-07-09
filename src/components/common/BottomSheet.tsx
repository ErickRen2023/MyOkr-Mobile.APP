import { useEffect, type ReactNode } from 'react';
import styles from './BottomSheet.module.css';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.sheet}>
        <div className={styles.handle} />
        {title && (
          <div className={styles.header}>
            <h3 className={styles.title}>{title}</h3>
            <button className={styles.close} onClick={onClose}>✕</button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
