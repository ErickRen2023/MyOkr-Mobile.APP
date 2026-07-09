import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Milestone } from '../../types';
import styles from './style.module.css';

interface SortableMilestoneProps {
  milestone: Milestone;
  index: number;
  total: number;
  onChange: (description: string) => void;
  onDelete: () => void;
}

export function SortableMilestone({ milestone, index, total, onChange, onDelete }: SortableMilestoneProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `ms-${milestone.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.msItem} ${isDragging ? styles.dragging : ''}`}
    >
      <div className={styles.dragHandle} {...attributes} {...listeners}>
        <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor" opacity="0.3">
          <circle cx="3" cy="2" r="1"/><circle cx="9" cy="2" r="1"/>
          <circle cx="3" cy="6" r="1"/><circle cx="9" cy="6" r="1"/>
          <circle cx="3" cy="10" r="1"/><circle cx="9" cy="10" r="1"/>
        </svg>
      </div>
      <input
        className={styles.fInput}
        value={milestone.description}
        onChange={e => onChange(e.target.value)}
        style={{ flex: 1 }}
      />
      <button className={styles.editorDelBtn} onClick={onDelete}>
        ✕
      </button>
    </div>
  );
}
