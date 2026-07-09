import { useEffect, useState } from 'react';
import { BottomSheet } from '../../components/common/BottomSheet';
import { createKeyResult } from '../../api/keyResults';
import styles from './style.module.css';

interface CreateKeyResultSheetProps {
  isOpen: boolean;
  onClose: () => void;
  objectiveId: number;
  onCreated: () => void;
  showToast: (msg: string) => void;
}

export function CreateKeyResultSheet({ isOpen, onClose, objectiveId, onCreated, showToast }: CreateKeyResultSheetProps) {
  const [krTitle, setKrTitle] = useState('');
  const [krDescription, setKrDescription] = useState('');
  const [krType, setKrType] = useState(1);
  const [krTargetVal, setKrTargetVal] = useState('');
  const [krUnit, setKrUnit] = useState('');
  const [krMilestones, setKrMilestones] = useState<string[]>(['']);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setKrTitle('');
      setKrDescription('');
      setKrType(1);
      setKrTargetVal('');
      setKrUnit('');
      setKrMilestones(['']);
      setCreating(false);
    }
  }, [isOpen]);

  const handleCreate = async () => {
    if (!krTitle.trim()) { showToast('请输入 KR 标题'); return; }
    if (krType === 1) {
      if (!krTargetVal.trim() || isNaN(Number(krTargetVal))) { showToast('请输入有效的目标值'); return; }
      if (!krUnit.trim()) { showToast('请输入单位'); return; }
    }
    setCreating(true);
    try {
      const target: Record<string, unknown> = krType === 1 ? { value: Number(krTargetVal), unit: krUnit.trim() } : {};
      const milestones = krType === 2 ? krMilestones.filter(m => m.trim()).map((m, i) => ({ description: m, sort_order: i })) : undefined;
      await createKeyResult({ objective_id: objectiveId, title: krTitle.trim(), description: krDescription.trim() || undefined, type: krType, target, milestones, sort_order: 0 });
      onClose();
      showToast('关键结果已创建');
      onCreated();
    } catch {
      showToast('创建关键结果失败');
    } finally {
      setCreating(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="创建关键结果">
      <div className={styles.field}>
        <label className={styles.fLabel}>KR 标题 <span style={{ color: 'var(--red)' }}>*</span></label>
        <input className={styles.fInput} value={krTitle} onChange={e => setKrTitle(e.target.value)} placeholder="如：GitHub 获得 500 Star" />
      </div>
      <div className={styles.field}>
        <label className={styles.fLabel}>描述（选填）</label>
        <textarea className={styles.fInput} rows={2} value={krDescription} onChange={e => setKrDescription(e.target.value)} placeholder="补充 KR 的背景与细节" />
      </div>
      <div className={styles.field}>
        <label className={styles.fLabel}>类型</label>
        <select className={styles.fInput} value={krType} onChange={e => setKrType(Number(e.target.value))}>
          <option value={1}>数值型</option>
          <option value={2}>里程碑型</option>
          <option value={3}>布尔型</option>
        </select>
      </div>
      {krType === 1 && (
        <div style={{ display: 'flex', gap: 8 }}>
          <div className={styles.field} style={{ flex: 1 }}>
            <label className={styles.fLabel}>目标值 <span style={{ color: 'var(--red)' }}>*</span></label>
            <input className={styles.fInput} type="number" value={krTargetVal} onChange={e => setKrTargetVal(e.target.value)} placeholder="500" />
          </div>
          <div className={styles.field} style={{ flex: 1 }}>
            <label className={styles.fLabel}>单位 <span style={{ color: 'var(--red)' }}>*</span></label>
            <input className={styles.fInput} value={krUnit} onChange={e => setKrUnit(e.target.value)} placeholder="Star" />
          </div>
        </div>
      )}
      {krType === 2 && (
        <div className={styles.field}>
          <label className={styles.fLabel}>里程碑节点</label>
          {krMilestones.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input className={styles.fInput} value={m} onChange={e => {
                const next = [...krMilestones];
                next[i] = e.target.value;
                setKrMilestones(next);
              }} placeholder={`节点 ${i + 1}`} />
              {krMilestones.length > 1 && <button className={styles.btnSec} onClick={() => setKrMilestones(krMilestones.filter((_, j) => j !== i))}>✕</button>}
            </div>
          ))}
          <button className={styles.btnSec} onClick={() => setKrMilestones([...krMilestones, ''])}>+ 添加节点</button>
        </div>
      )}
      <div className={styles.sheetBtns}>
        <button className={styles.btnSec} onClick={onClose}>取消</button>
        <button className={styles.btnPri} onClick={handleCreate} disabled={creating}>
          {creating ? '创建中...' : '创建'}
        </button>
      </div>
    </BottomSheet>
  );
}
