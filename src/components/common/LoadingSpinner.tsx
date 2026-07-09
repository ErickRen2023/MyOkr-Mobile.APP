import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  text?: string;
}

export function LoadingSpinner({ text = '加载中...' }: LoadingSpinnerProps) {
  return (
    <div className={styles.spinner}>
      <div className={styles.ring} />
      <span className={styles.text}>{text}</span>
    </div>
  );
}
