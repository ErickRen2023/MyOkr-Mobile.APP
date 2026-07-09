import { useEffect, useState } from 'react';
import { BottomSheet } from '../../components/common/BottomSheet';
import { updateProgress, toggleAchieved } from '../../api/keyResults';
import { toggleMilestone } from '../../api/milestones';
import type { KeyResult } from '../../types';
import styles from './style.module.css';

interface UpdateProgressSheetProps {
  isOpen: boolean;
  onClose: () => void;
  keyResult: KeyResult | null;
  onSaved: () => void;
  showToast: (msg: string) => void;
}

export function UpdateProgressSheet({ isOpen, onClose, keyResult, onSaved, showToast }: UpdateProgressSheetProps) {
  const [progressVal, setProgressVal] = useState('');
  const [toggledMsIds, setToggledMsIds] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && keyResult) {
      setProgressVal(String(keyResult.current_value ?? ''));
      setToggledMsIds(new Set());
      setSaving(false);
    }
  }, [isOpen, keyResult]);

  const handleSave = async () => {
    if (!keyResult) return;
    setSaving(true);
    try {
      if (keyResult.type === 1) {
        const val = parseFloat(progressVal);
        if (isNaN(val) || val < 0) { showToast('请输入有效数值'); setSaving(false); return; }
        await updateProgress(keyResult.id, val);
      } else if (keyResult.type === 2) {
        for (const msId of toggledMsIds) {
          await toggleMilestone(msId);
        }
      }
      onClose();
      showToast('进度已更新');
      onSaved();
    } catch {
      showToast('更新失败');
    } finally {
      setSaving(false);
    }
  };

  const handleBooleanUpdate = async (achieved: boolean) => {
    if (!keyResult) return;
    try {
      await toggleAchieved(keyResult.id, achieved ? 1 : 0);
      onClose();
      showToast(achieved ? '已标记为达成' : '已标记为未达成');
      onSaved();
    } catch {
      showToast('更新失败');
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="更新 KR 进度">
      {keyResult && (
        <>
          <div className={styles.krTitle}>{keyResult.title}</div>
          {keyResult.type === 1 && (
            <div className={styles.field}>
              <label className={styles.fLabel}>当前进展</label>
              <input className={styles.fInput} type="number" step="any" value={progressVal} onChange={e => setProgressVal(e.target.value)} style={{ fontSize: 18, textAlign: 'center' }} />
            </div>
          )}
          {keyResult.type === 2 && keyResult.milestones && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {keyResult.milestones.filter(m => !m.is_deleted).map(m => {
                const toggled = toggledMsIds.has(m.id);
                const done = m.completed ? !toggled : toggled;
                return (
                  <div key={m.id} className={`${styles.msItem} ${done ? styles.msDone : ''}`} onClick={() => {
                    setToggledMsIds(prev => {
                      const next = new Set(prev);
                      if (next.has(m.id)) next.delete(m.id); else next.add(m.id);
                      return next;
                    });
                  }} style={{ cursor: 'pointer', padding: '6px 0' }}>
                    <div className={`${styles.msCheck} ${done ? styles.msCheckDone : ''}`}>{done ? '✓' : ''}</div>
                    <span>{m.description}</span>
                  </div>
                );
              })}
            </div>
          )}
          {keyResult.type === 3 && (
            <p style={{ textAlign: 'center', padding: '16px 0', fontSize: 16 }}>
              当前状态：<strong>{keyResult.is_achieved ? '已达成 ✓' : '未达成'}</strong>
            </p>
          )}
          <div className={styles.sheetBtns}>
            <button className={styles.btnSec} onClick={onClose}>取消</button>
            {keyResult.type === 3 ? (
              <>
                {keyResult.is_achieved ? (
                  <button className={styles.btnPri} style={{ background: 'var(--orange)' }} onClick={() => handleBooleanUpdate(false)}>标记为未达成</button>
                ) : (
                  <button className={styles.btnPri} onClick={() => handleBooleanUpdate(true)}>标记为已达成</button>
                )}
              </>
            ) : (
              <button className={styles.btnPri} onClick={handleSave} disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </button>
            )}
          </div>
        </>
      )}
    </BottomSheet>
  );
}
