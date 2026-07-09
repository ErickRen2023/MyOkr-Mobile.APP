import { useState } from 'react';
import { BottomSheet } from '../../components/common/BottomSheet';
import { createCycle } from '../../api/cycles';
import { CycleType } from '../../types/enums';
import {
  getCycleDates,
  getDefaultPeriod,
  getPeriodOptions,
  getCycleDisplayName,
  getYearOptions,
} from '../../utils/cycleDates';
import styles from './style.module.css';

interface CreateCycleSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  showToast: (msg: string) => void;
}

export function CreateCycleSheet({ isOpen, onClose, onCreated, showToast }: CreateCycleSheetProps) {
  const [newCycleType, setNewCycleType] = useState(3);
  const [newCycleYear, setNewCycleYear] = useState(new Date().getFullYear());
  const [newCyclePeriod, setNewCyclePeriod] = useState(2);
  const [creating, setCreating] = useState(false);

  const handleReset = () => {
    const dp = getDefaultPeriod(CycleType.Quarterly);
    setNewCycleType(3);
    setNewCycleYear(dp.year);
    setNewCyclePeriod(dp.period);
  };

  const handleCreate = async () => {
    const { start, end } = getCycleDates(newCycleType as CycleType, newCycleYear, newCyclePeriod);
    setCreating(true);
    try {
      const res = await createCycle({ type: newCycleType, start_date: start, end_date: end });
      if (res.code === 0) {
        onClose();
        showToast('周期已创建');
        onCreated();
      } else {
        showToast(res.message || '创建周期失败');
      }
    } catch {
      showToast('创建周期失败');
    } finally {
      setCreating(false);
    }
  };

  const { start, end } = getCycleDates(newCycleType as CycleType, newCycleYear, newCyclePeriod);
  const name = getCycleDisplayName(newCycleType as CycleType, newCycleYear, newCyclePeriod);
  const periodOptions = getPeriodOptions(newCycleType as CycleType);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="创建新周期">
      <div className={styles.field}>
        <label className={styles.fLabel}>周期类型</label>
        <select className={styles.fInput} value={newCycleType} onChange={e => {
          const t = Number(e.target.value) as CycleType;
          setNewCycleType(t);
          const dp = getDefaultPeriod(t);
          setNewCycleYear(dp.year);
          setNewCyclePeriod(dp.period);
        }}>
          <option value={1}>月度（M）</option>
          <option value={2}>双月度</option>
          <option value={3}>季度（Q）</option>
          <option value={4}>半年度</option>
          <option value={5}>年度</option>
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.fLabel}>选择周期</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className={styles.fInput} value={newCycleYear} onChange={e => setNewCycleYear(Number(e.target.value))}>
            {getYearOptions().map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {periodOptions.length > 0 && (
            <select className={styles.fInput} value={newCyclePeriod} onChange={e => setNewCyclePeriod(Number(e.target.value))}>
              {periodOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.fLabel}>周期范围</label>
        <div className={styles.cyclePreview}>
          <div className={styles.cyclePreviewName}>{name}</div>
          <div className={styles.cyclePreviewDate}>{start} 至 {end}</div>
        </div>
      </div>

      <div className={styles.sheetBtns}>
        <button className={styles.btnSec} onClick={onClose} disabled={creating}>取消</button>
        <button className={styles.btnPri} onClick={handleCreate} disabled={creating}>
          {creating ? '创建中...' : '创建'}
        </button>
      </div>
    </BottomSheet>
  );
}
