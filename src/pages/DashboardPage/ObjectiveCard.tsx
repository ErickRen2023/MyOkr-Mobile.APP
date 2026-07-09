import { useState } from 'react';
import { reorderKeyResults } from '../../api/keyResults';
import type { Objective, KeyResult } from '../../types';
import { KeyResultItem } from './KeyResultItem';
import styles from './style.module.css';

interface ObjectiveCardProps {
  obj: Objective;
  index: number;
  total: number;
  onEditKR: (kr: KeyResult) => void;
  onCreateKR: (objId: number) => void;
  onEditObjective: (obj: Objective) => void;
  onEditKRItem: (kr: KeyResult) => void;
  onReorderObjectives: (fromIndex: number, toIndex: number) => void;
  onReorderKRs: (objId: number, fromIndex: number, toIndex: number) => void;
  showToast: (msg: string) => void;
  onRefresh: () => void;
}

export function ObjectiveCard({
  obj, index, total,
  onEditKR, onCreateKR, onEditObjective, onEditKRItem,
  onReorderObjectives, onReorderKRs,
  showToast, onRefresh
}: ObjectiveCardProps) {
  const [expanded, setExpanded] = useState(true);

  const handleMoveUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (index === 0) return;
    onReorderObjectives(index, index - 1);
  };

  const handleMoveDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (index === total - 1) return;
    onReorderObjectives(index, index + 1);
  };

  const handleKRMoveUp = (krIndex: number) => {
    if (krIndex === 0) return;
    onReorderKRs(obj.id, krIndex, krIndex - 1);
  };

  const handleKRMoveDown = (krIndex: number) => {
    if (krIndex === obj.key_results.length - 1) return;
    onReorderKRs(obj.id, krIndex, krIndex + 1);
  };

  return (
    <div className={`${styles.oCard} ${expanded ? styles.expanded : ''}`}>
      <div className={styles.oHeader} onClick={() => setExpanded(!expanded)}>
        <div className={styles.oLeft}>
          <div className={styles.moveBtns}>
            <button className={styles.moveBtn} onClick={handleMoveUp} disabled={index === 0}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <button className={styles.moveBtn} onClick={handleMoveDown} disabled={index === total - 1}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>
          <div className={styles.oDot} />
          <div style={{ minWidth: 0 }}>
            <div className={styles.oTitle}>{obj.title}</div>
            {obj.description && <div className={styles.oMeta}>{obj.description}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div className={styles.oBadge}>{obj.progress}%</div>
          <button className={styles.editBtn} onClick={(e) => {
            e.stopPropagation();
            onEditObjective(obj);
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            编辑
          </button>
          <svg className={styles.oChev} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>
      {expanded && (
        <div className={styles.oBody}>
          <div className={styles.krList}>
            {obj.key_results.map((kr, krIndex) => (
              <KeyResultItem
                key={kr.id}
                kr={kr}
                index={krIndex}
                total={obj.key_results.length}
                onEdit={() => onEditKR(kr)}
                onEditKRItem={onEditKRItem}
                onMoveUp={() => handleKRMoveUp(krIndex)}
                onMoveDown={() => handleKRMoveDown(krIndex)}
              />
            ))}
          </div>
          <button className={styles.addKrBtn} onClick={(e) => { e.stopPropagation(); onCreateKR(obj.id); }}>+ 添加关键结果</button>
        </div>
      )}
    </div>
  );
}
