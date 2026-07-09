import { useCallback, useEffect, useState } from 'react';
import { useCycles } from '../../contexts/CycleContext';
import { useToast } from '../../contexts/ToastContext';
import { fetchDashboard } from '../../api/dashboard';
import { reorderObjectives } from '../../api/objectives';
import { reorderKeyResults } from '../../api/keyResults';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { CycleType } from '../../types/enums';
import { getDefaultPeriod } from '../../utils/cycleDates';
import type { DashboardData, Objective, KeyResult } from '../../types';
import styles from './style.module.css';
import { ObjectiveCard } from './ObjectiveCard';
import { CreateCycleSheet } from './CreateCycleSheet';
import { CreateObjectiveSheet } from './CreateObjectiveSheet';
import { CreateKeyResultSheet } from './CreateKeyResultSheet';
import { UpdateProgressSheet } from './UpdateProgressSheet';
import { EditObjectiveSheet } from './EditObjectiveSheet';
import { EditKeyResultSheet } from './EditKeyResultSheet';

export function DashboardPage() {
  const { cycles, currentCycleId, loading: cyclesLoading, setCurrentCycleId, refreshCycles } = useCycles();
  const { showToast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Sheet states
  const [showCreateCycle, setShowCreateCycle] = useState(false);
  const [showCreateO, setShowCreateO] = useState(false);
  const [showCreateKR, setShowCreateKR] = useState(false);
  const [krObjectiveId, setKrObjectiveId] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [editingKR, setEditingKR] = useState<KeyResult | null>(null);
  const [showEditO, setShowEditO] = useState(false);
  const [editingObj, setEditingObj] = useState<Objective | null>(null);
  const [showEditKR, setShowEditKR] = useState(false);
  const [editingKrForEdit, setEditingKrForEdit] = useState<KeyResult | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!currentCycleId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchDashboard(String(currentCycleId));
      if (res.code === 0) setData(res.data);
    } catch {
      showToast('加载仪表盘失败');
    } finally {
      setLoading(false);
    }
  }, [currentCycleId, showToast]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Listen for FAB click
  useEffect(() => {
    const handler = () => {
      if (cycles.length === 0) {
        showToast('请先创建周期');
        return;
      }
      setShowCreateO(true);
    };
    window.addEventListener('open-create-objective', handler);
    return () => window.removeEventListener('open-create-objective', handler);
  }, [cycles.length, showToast]);

  // Reorder handlers
  const handleReorderObjectives = async (fromIndex: number, toIndex: number) => {
    if (!data) return;
    const newData = structuredClone(data);
    const [moved] = newData.objectives.splice(fromIndex, 1);
    newData.objectives.splice(toIndex, 0, moved);
    setData(newData);
    try {
      await reorderObjectives(newData.objectives.map((o, i) => ({ id: o.id, sort_order: i })));
    } catch {
      showToast('排序更新失败');
      loadDashboard();
    }
  };

  const handleReorderKRs = async (objId: number, fromIndex: number, toIndex: number) => {
    if (!data) return;
    const newData = structuredClone(data);
    const obj = newData.objectives.find(o => o.id === objId);
    if (!obj) return;
    const [moved] = obj.key_results.splice(fromIndex, 1);
    obj.key_results.splice(toIndex, 0, moved);
    setData(newData);
    try {
      await reorderKeyResults(obj.key_results.map((kr, i) => ({ id: kr.id, sort_order: i })));
    } catch {
      showToast('排序更新失败');
      loadDashboard();
    }
  };

  const renderBody = () => {
    if (cyclesLoading) {
      return <LoadingSpinner />;
    }

    if (cycles.length === 0) {
      return (
        <EmptyState
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="8 12 12 8 16 12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>}
          title="还没有周期"
          description="OKR 按周期管理，请先创建一个周期再设定目标"
          action={
            <button className={styles.createBtn} onClick={() => {
              setShowCreateCycle(true);
            }}>创建第一个周期</button>
          }
        />
      );
    }

    if (loading) {
      return <LoadingSpinner />;
    }

    // Cycle selector as horizontal pills
    const cycleSelector = (
      <div className={styles.cyclePills}>
        {cycles.map(c => (
          <button
            key={c.id}
            className={`${styles.cyclePill} ${c.id === currentCycleId ? styles.cyclePillActive : ''}`}
            onClick={() => setCurrentCycleId(c.id)}
          >
            {c.name}
          </button>
        ))}
        <button className={styles.cyclePill} onClick={() => setShowCreateCycle(true)} style={{ borderStyle: 'dashed' }}>
          + 新建
        </button>
      </div>
    );

    if (!data || data.objectives.length === 0) {
      return (
        <>
          <div className={styles.topbar}>
            {cycleSelector}
            <button className={styles.createBtn} onClick={() => setShowCreateO(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              创建新 O
            </button>
          </div>
          <EmptyState
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>}
            title="还没有目标"
            description="这个周期还没有设置任何 Objective，点击下方按钮创建你的第一个目标"
            action={<button className={styles.createBtn} onClick={() => setShowCreateO(true)}>创建第一个 O</button>}
          />
        </>
      );
    }

    return (
      <>
        <div className={styles.topbar}>
          {cycleSelector}
          <button className={styles.createBtn} onClick={() => setShowCreateO(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            创建新 O
          </button>
        </div>

        <div className={styles.overview}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>完成率</div>
            <div className={`${styles.statValue} ${styles.green}`}>{data.summary.average_kr_progress}%</div>
            <div className={styles.statSub}>{data.summary.completed_objectives} / {data.summary.total_key_results} KR 已完成</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>距周期结束</div>
            <div className={`${styles.statValue} ${styles.blue}`}>{data.cycles[0]?.remaining_days || 0} 天</div>
            <div className={styles.statSub}>{data.cycles[0]?.end_date || ''} 截止</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>KR 总数</div>
            <div className={`${styles.statValue} ${styles.orange}`}>{data.summary.total_key_results}</div>
            <div className={styles.statSub}>分布在 {data.summary.total_objectives} 个目标中</div>
          </div>
        </div>

        <div className={styles.oList}>
          {data.objectives.map((obj: Objective, index: number) => (
            <ObjectiveCard
              key={obj.id}
              obj={obj}
              index={index}
              total={data.objectives.length}
              onEditKR={(kr) => {
                setEditingKR(kr);
                setShowProgress(true);
              }}
              onCreateKR={(objId) => {
                setKrObjectiveId(objId);
                setShowCreateKR(true);
              }}
              onEditObjective={(obj) => {
                setEditingObj(obj);
                setShowEditO(true);
              }}
              onEditKRItem={(kr) => {
                setEditingKrForEdit(kr);
                setShowEditKR(true);
              }}
              onReorderObjectives={handleReorderObjectives}
              onReorderKRs={handleReorderKRs}
              showToast={showToast}
              onRefresh={loadDashboard}
            />
          ))}
        </div>
      </>
    );
  };

  return (
    <div>
      {renderBody()}

      {/* Create Cycle Sheet */}
      <CreateCycleSheet
        isOpen={showCreateCycle}
        onClose={() => setShowCreateCycle(false)}
        onCreated={refreshCycles}
        showToast={showToast}
      />

      {/* Create O Sheet */}
      <CreateObjectiveSheet
        isOpen={showCreateO}
        onClose={() => setShowCreateO(false)}
        cycles={cycles}
        currentCycleId={currentCycleId}
        onCreated={loadDashboard}
        showToast={showToast}
      />

      {/* Create KR Sheet */}
      <CreateKeyResultSheet
        isOpen={showCreateKR}
        onClose={() => setShowCreateKR(false)}
        objectiveId={krObjectiveId}
        onCreated={loadDashboard}
        showToast={showToast}
      />

      {/* Update Progress Sheet */}
      <UpdateProgressSheet
        isOpen={showProgress}
        onClose={() => { setShowProgress(false); setEditingKR(null); }}
        keyResult={editingKR}
        onSaved={loadDashboard}
        showToast={showToast}
      />

      {/* Edit O Sheet */}
      <EditObjectiveSheet
        isOpen={showEditO}
        onClose={() => { setShowEditO(false); setEditingObj(null); }}
        objective={editingObj}
        onSaved={loadDashboard}
        showToast={showToast}
      />

      {/* Edit KR Sheet */}
      <EditKeyResultSheet
        isOpen={showEditKR}
        onClose={() => { setShowEditKR(false); setEditingKrForEdit(null); }}
        keyResult={editingKrForEdit}
        onSaved={loadDashboard}
        showToast={showToast}
      />
    </div>
  );
}
