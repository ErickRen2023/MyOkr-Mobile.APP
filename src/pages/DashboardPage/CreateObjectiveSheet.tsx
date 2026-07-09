import { useEffect, useState } from 'react';
import { BottomSheet } from '../../components/common/BottomSheet';
import { createObjective } from '../../api/objectives';
import type { Cycle } from '../../types';
import styles from './style.module.css';

interface CreateObjectiveSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cycles: Cycle[];
  currentCycleId: number | null;
  onCreated: () => void;
  showToast: (msg: string) => void;
}

export function CreateObjectiveSheet({ isOpen, onClose, cycles, currentCycleId, onCreated, showToast }: CreateObjectiveSheetProps) {
  const [newOTitle, setNewOTitle] = useState('');
  const [newODesc, setNewODesc] = useState('');
  const [newOCycleId, setNewOCycleId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewOTitle('');
      setNewODesc('');
      setNewOCycleId(currentCycleId);
      setCreating(false);
    }
  }, [isOpen, currentCycleId]);

  const handleCreate = async () => {
    if (!newOTitle.trim()) { showToast('请输入目标标题'); return; }
    setCreating(true);
    try {
      await createObjective({ cycle_id: newOCycleId || currentCycleId || 0, title: newOTitle.trim(), description: newODesc.trim() || undefined });
      onClose();
      showToast(`目标「${newOTitle.trim()}」已创建`);
      onCreated();
    } catch {
      showToast('创建目标失败');
    } finally {
      setCreating(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="创建新目标">
      <div className={styles.field}>
        <label className={styles.fLabel}>目标标题 *</label>
        <input className={styles.fInput} value={newOTitle} onChange={e => setNewOTitle(e.target.value)} placeholder="如：提升技术影响力" />
      </div>
      <div className={styles.field}>
        <label className={styles.fLabel}>描述（选填）</label>
        <textarea className={styles.fInput} rows={3} value={newODesc} onChange={e => setNewODesc(e.target.value)} placeholder="补充目标的背景与细节" />
      </div>
      <div className={styles.field}>
        <label className={styles.fLabel}>所属周期</label>
        <select className={styles.fInput} value={newOCycleId || currentCycleId || ''} onChange={e => setNewOCycleId(Number(e.target.value))}>
          {cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className={styles.sheetBtns}>
        <button className={styles.btnSec} onClick={onClose}>取消</button>
        <button className={styles.btnPri} onClick={handleCreate} disabled={creating}>
          {creating ? '创建中...' : '创建'}
        </button>
      </div>
    </BottomSheet>
  );
}
