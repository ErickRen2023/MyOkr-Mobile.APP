import { useEffect, useState, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { SortableMilestone } from './SortableMilestone';
import { BottomSheet } from '../../components/common/BottomSheet';
import { updateKeyResult, archiveKeyResult } from '../../api/keyResults';
import { createMilestone, updateMilestone, deleteMilestone, reorderMilestones } from '../../api/milestones';
import type { KeyResult, Milestone } from '../../types';
import styles from './style.module.css';

const TYPE_LABELS: Record<number, string> = { 1: '数值型', 2: '里程碑型', 3: '布尔型' };

interface EditKeyResultSheetProps {
  isOpen: boolean;
  onClose: () => void;
  keyResult: KeyResult | null;
  onSaved: () => void;
  showToast: (msg: string) => void;
}

export function EditKeyResultSheet({ isOpen, onClose, keyResult, onSaved, showToast }: EditKeyResultSheetProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetVal, setTargetVal] = useState('');
  const [unit, setUnit] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [editMilestones, setEditMilestones] = useState<Milestone[]>([]);
  const [newMilestones, setNewMilestones] = useState<string[]>(['']);
  const [deletedMsIds, setDeletedMsIds] = useState<Set<number>>(new Set());
  const [originalDescs, setOriginalDescs] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    if (isOpen && keyResult) {
      setTitle(keyResult.title);
      setDescription(keyResult.description || '');
      setShowDeleteConfirm(false);
      setSaving(false);

      if (keyResult.type === 1) {
        setTargetVal(String((keyResult.target as Record<string, unknown>)?.value ?? ''));
        setUnit(String((keyResult.target as Record<string, unknown>)?.unit ?? ''));
      }

      if (keyResult.type === 2 && keyResult.milestones) {
        const cloned = structuredClone(keyResult.milestones);
        setEditMilestones(cloned);
        setNewMilestones(['']);
        setDeletedMsIds(new Set());
        setOriginalDescs(new Map(cloned.map(m => [m.id, m.description])));
      }
    }
  }, [isOpen, keyResult]);

  const visibleMs = editMilestones.filter(m => !deletedMsIds.has(m.id));
  const visibleMsIds = visibleMs.map(m => `ms-${m.id}`);

  // DnD sensors for milestone reordering
  const msSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleMsDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = visibleMs.findIndex(m => `ms-${m.id}` === active.id);
    const newIndex = visibleMs.findIndex(m => `ms-${m.id}` === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedVisible = arrayMove(visibleMs, oldIndex, newIndex);
    // Reconstruct editMilestones preserving deleted items' positions
    const newEditMilestones: Milestone[] = [];
    let vi = 0;
    for (const m of editMilestones) {
      if (deletedMsIds.has(m.id)) {
        newEditMilestones.push(m);
      } else {
        newEditMilestones.push(reorderedVisible[vi++]);
      }
    }
    setEditMilestones(newEditMilestones);
  }, [visibleMs, editMilestones, deletedMsIds]);

  const handleSave = async () => {
    if (!title.trim()) {
      showToast('请输入 KR 标题');
      return;
    }

    let target: Record<string, unknown> | undefined;
    if (keyResult!.type === 1) {
      if (!targetVal.trim() || isNaN(Number(targetVal))) {
        showToast('请输入有效的目标值');
        return;
      }
      if (!unit.trim()) {
        showToast('请输入单位');
        return;
      }
      target = { value: Number(targetVal), unit: unit.trim() };
    }

    setSaving(true);

    try {
      await updateKeyResult({
        id: keyResult!.id,
        title: title.trim(),
        description: description.trim() || undefined,
        target,
      });
    } catch {
      showToast('更新失败');
      setSaving(false);
      return;
    }

    if (keyResult!.type === 2) {
      const createdIds: number[] = [];
      for (const desc of newMilestones) {
        const trimmed = desc.trim();
        if (!trimmed) continue;
        try {
          const res = await createMilestone({ key_result_id: keyResult!.id, description: trimmed });
          if (res.code === 0 && res.data) createdIds.push(res.data.id);
        } catch {
          showToast('创建节点失败');
          setSaving(false);
          return;
        }
      }

      for (const m of editMilestones) {
        if (deletedMsIds.has(m.id)) continue;
        if (originalDescs.get(m.id) !== m.description) {
          try {
            await updateMilestone({ id: m.id, description: m.description });
          } catch {
            showToast('更新节点失败');
            setSaving(false);
            return;
          }
        }
      }

      for (const id of deletedMsIds) {
        try {
          await deleteMilestone(id);
        } catch {
          showToast('删除节点失败');
          setSaving(false);
          return;
        }
      }

      const survivingIds = editMilestones.filter(m => !deletedMsIds.has(m.id)).map(m => m.id);
      const allIds = [...survivingIds, ...createdIds];
      if (allIds.length > 0) {
        try {
          await reorderMilestones(allIds.map((id, i) => ({ id, sort_order: i })));
        } catch {
          showToast('排序更新失败');
          setSaving(false);
          return;
        }
      }
    }

    setSaving(false);
    showToast('关键结果已更新');
    onSaved();
    onClose();
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await archiveKeyResult(keyResult!.id);
      showToast('关键结果已删除');
      setShowDeleteConfirm(false);
      onSaved();
      onClose();
    } catch {
      showToast('删除失败');
    } finally {
      setSaving(false);
    }
  };

  const krType = keyResult?.type ?? 1;

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose} title="编辑关键结果">
        <div className={styles.field}>
          <label className={styles.fLabel}>类型</label>
          <div className={styles.krTypeReadonly}>{TYPE_LABELS[krType] || krType}</div>
        </div>
        <div className={styles.field}>
          <label className={styles.fLabel}>KR 标题 *</label>
          <input className={styles.fInput} value={title} onChange={e => setTitle(e.target.value)} placeholder="如：GitHub 获得 500 Star" />
        </div>
        <div className={styles.field}>
          <label className={styles.fLabel}>描述（选填）</label>
          <textarea className={styles.fInput} rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="补充 KR 的背景与细节" />
        </div>
        {krType === 1 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <div className={styles.field} style={{ flex: 1 }}>
              <label className={styles.fLabel}>目标值 *</label>
              <input className={styles.fInput} type="number" value={targetVal} onChange={e => setTargetVal(e.target.value)} placeholder="500" />
            </div>
            <div className={styles.field} style={{ flex: 1 }}>
              <label className={styles.fLabel}>单位 *</label>
              <input className={styles.fInput} value={unit} onChange={e => setUnit(e.target.value)} placeholder="Star" />
            </div>
          </div>
        )}
        {krType === 2 && (
          <div className={styles.field}>
            <label className={styles.fLabel}>里程碑节点</label>
            {visibleMs.length === 0 && newMilestones.every(m => !m.trim()) ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>暂无里程碑节点，请在下方添加</p>
            ) : (
              <DndContext sensors={msSensors} collisionDetection={closestCenter} onDragEnd={handleMsDragEnd}>
                <SortableContext items={visibleMsIds} strategy={verticalListSortingStrategy}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {visibleMs.map((m, index) => (
                      <SortableMilestone
                        key={m.id}
                        milestone={m}
                        index={index}
                        total={visibleMs.length}
                        onChange={(desc) => {
                          const next = editMilestones.map(x => x.id === m.id ? { ...x, description: desc } : x);
                          setEditMilestones(next);
                        }}
                        onDelete={() => setDeletedMsIds(prev => new Set([...prev, m.id]))}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {newMilestones.map((desc, i) => (
              <div key={`new-${i}`} className={styles.msItem} style={{ gap: 6, marginTop: 8 }}>
                <div style={{ width: 46, flexShrink: 0 }} />
                <input
                  className={styles.fInput}
                  value={desc}
                  onChange={e => {
                    const next = [...newMilestones];
                    next[i] = e.target.value;
                    setNewMilestones(next);
                  }}
                  placeholder={`新节点 ${i + 1}`}
                  style={{ flex: 1 }}
                />
                <button className={styles.editorDelBtn} onClick={() => setNewMilestones(newMilestones.filter((_, j) => j !== i))}>
                  ✕
                </button>
              </div>
            ))}

            <button className={styles.editorAddBtn} onClick={() => setNewMilestones([...newMilestones, ''])}>
              + 添加节点
            </button>
          </div>
        )}
        <div className={styles.sheetBtnsDual}>
          <button className={styles.btnSec} onClick={() => setShowDeleteConfirm(true)} disabled={saving}>删除</button>
          <div className={styles.sheetBtnsGroup}>
            <button className={styles.btnSec} onClick={onClose} disabled={saving}>取消</button>
            <button className={styles.btnPri} onClick={handleSave} disabled={saving || !title.trim()}>
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="确认删除">
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
          确定要删除关键结果「{keyResult?.title}」吗？
        </p>
        <div className={styles.sheetBtns}>
          <button className={styles.btnSec} onClick={() => setShowDeleteConfirm(false)} disabled={saving}>取消</button>
          <button className={styles.btnDanger} onClick={handleDelete} disabled={saving}>
            {saving ? '删除中...' : '确认删除'}
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
