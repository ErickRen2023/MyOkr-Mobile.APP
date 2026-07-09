import { useState, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
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
  onReorderKRs: (objId: number, fromIndex: number, toIndex: number) => void;
  onRefresh: () => void;
  showToast: (msg: string) => void;
}

export function ObjectiveCard({
  obj, index, total,
  onEditKR, onCreateKR, onEditObjective, onEditKRItem, onReorderKRs,
  onRefresh, showToast
}: ObjectiveCardProps) {
  const [expanded, setExpanded] = useState(true);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `o-${obj.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  // KR-level DnD sensors
  const krSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const krIds = obj.key_results.map(kr => `kr-${kr.id}`);

  const handleKRDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = obj.key_results.findIndex(kr => `kr-${kr.id}` === active.id);
    const newIndex = obj.key_results.findIndex(kr => `kr-${kr.id}` === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    onReorderKRs(obj.id, oldIndex, newIndex);
  }, [obj, onReorderKRs]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.oCard} ${expanded ? styles.expanded : ''} ${isDragging ? styles.dragging : ''}`}
    >
      <div className={styles.oHeader} onClick={() => setExpanded(!expanded)}>
        <div className={styles.oLeft}>
          <div className={styles.dragHandle} {...attributes} {...listeners} onClick={(e) => e.stopPropagation()}>
            <svg width="16" height="16" viewBox="0 0 12 12" fill="currentColor" opacity="0.35">
              <circle cx="3" cy="2" r="1"/><circle cx="9" cy="2" r="1"/>
              <circle cx="3" cy="6" r="1"/><circle cx="9" cy="6" r="1"/>
              <circle cx="3" cy="10" r="1"/><circle cx="9" cy="10" r="1"/>
            </svg>
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
          <DndContext sensors={krSensors} collisionDetection={closestCenter} onDragEnd={handleKRDragEnd}>
            <SortableContext items={krIds} strategy={verticalListSortingStrategy}>
              <div className={styles.krList}>
                {obj.key_results.map((kr, krIndex) => (
                  <KeyResultItem
                    key={kr.id}
                    kr={kr}
                    index={krIndex}
                    total={obj.key_results.length}
                    onEdit={() => onEditKR(kr)}
                    onEditKRItem={onEditKRItem}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <button className={styles.addKrBtn} onClick={(e) => { e.stopPropagation(); onCreateKR(obj.id); }}>+ 添加关键结果</button>
        </div>
      )}
    </div>
  );
}
