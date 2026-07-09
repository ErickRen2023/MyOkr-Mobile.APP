import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { KeyResult } from '../../types';
import styles from './style.module.css';

interface KeyResultItemProps {
  kr: KeyResult;
  index: number;
  total: number;
  onEdit: () => void;
  onEditKRItem: (kr: KeyResult) => void;
}

export function KeyResultItem({ kr, index, total, onEdit, onEditKRItem }: KeyResultItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `kr-${kr.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  const p = kr.progress;
  const color = p >= 80 ? 'green' : p >= 50 ? 'blue' : p >= 25 ? 'orange' : 'red';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.krItem} ${isDragging ? styles.dragging : ''}`}
    >
      <div className={styles.krHeader}>
        <div className={styles.dragHandle} {...attributes} {...listeners}>
          <svg width="16" height="16" viewBox="0 0 12 12" fill="currentColor" opacity="0.35">
            <circle cx="3" cy="2" r="1"/><circle cx="9" cy="2" r="1"/>
            <circle cx="3" cy="6" r="1"/><circle cx="9" cy="6" r="1"/>
            <circle cx="3" cy="10" r="1"/><circle cx="9" cy="10" r="1"/>
          </svg>
        </div>
        <span className={styles.krTitle}>{kr.title}</span>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, flexShrink: 0 }}>
          <span className={styles.krValue}>
          {kr.type === 1 ? `${kr.current_value ?? 0} / ${(kr.target as Record<string, unknown>)?.value ?? '?'} ${(kr.target as Record<string, unknown>)?.unit ?? ''}` : ''}
          {kr.type === 2 ? `${kr.milestones?.filter(m => m.completed).length ?? 0}/${kr.milestones?.length ?? 0} 节点` : ''}
          {kr.type === 3 ? (kr.is_achieved ? '已达成' : '未达成') : ''} ({p}%)
          </span>
          <button className={styles.editBtn} onClick={(e) => {
            e.stopPropagation();
            onEditKRItem(kr);
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            编辑
          </button>
        </div>
      </div>
      {kr.description && <div className={styles.krDesc}>{kr.description}</div>}
      <div className={styles.krBar}>
        <div className={`${styles.krBarFill} ${styles[color]}`} style={{ width: `${Math.min(p, 100)}%` }} />
      </div>
      {kr.type === 2 && kr.milestones && (
        <div className={styles.msList}>
          {kr.milestones.filter(m => !m.is_deleted).map((m) => (
            <div key={m.id} className={`${styles.msItem} ${m.completed ? styles.msDone : ''}`}>
              <div className={`${styles.msCheck} ${m.completed ? styles.msCheckDone : ''}`}>{m.completed ? '✓' : ''}</div>
              <span style={{ flex: 1 }}>{m.description}</span>
            </div>
          ))}
        </div>
      )}
      <div className={styles.krActions}>
        <button className={styles.updateBtn} onClick={onEdit}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><path d="M21 16v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/></svg>
          更新进度
        </button>
      </div>
    </div>
  );
}
