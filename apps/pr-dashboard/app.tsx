import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { LayoutDashboard, GitBranch, Activity, RefreshCw } from 'lucide-react';
import { Overview } from './components/Overview';
import { RepoGrid } from './components/RepoGrid';
import { ActivityFeed } from './components/ActivityFeed';
import { DailyStat, PrAction, MonitoredRepo, JulesSession, TriggerRun } from './types';

type Tab = 'overview' | 'repos' | 'activity';

interface AppData {
  stats: DailyStat[];
  actions: PrAction[];
  repos: MonitoredRepo[];
  sessions: JulesSession[];
  triggerRuns: TriggerRun[];
  totalMerged: number;
  totalClosed: number;
}

async function loadData(): Promise<AppData> {
  const [statsRows, actionsRows, reposRows, sessionsRows, triggerRows, totalsRows] = await Promise.all([
    window.tasklet.sqlQuery('SELECT * FROM daily_stats ORDER BY date DESC LIMIT 7') as unknown as Promise<DailyStat[]>,
    window.tasklet.sqlQuery('SELECT * FROM pr_actions ORDER BY created_at DESC LIMIT 200') as unknown as Promise<PrAction[]>,
    window.tasklet.sqlQuery("SELECT * FROM monitored_repos WHERE active = 1 ORDER BY CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END") as unknown as Promise<MonitoredRepo[]>,
    window.tasklet.sqlQuery('SELECT * FROM jules_sessions ORDER BY created_at DESC LIMIT 50') as unknown as Promise<JulesSession[]>,
    window.tasklet.sqlQuery('SELECT * FROM trigger_runs ORDER BY timestamp DESC LIMIT 5') as unknown as Promise<TriggerRun[]>,
    window.tasklet.sqlQuery('SELECT SUM(prs_merged) as merged, SUM(prs_closed) as closed FROM daily_stats') as unknown as Promise<Array<{merged: number; closed: number}>>,
  ]);

  const totals = totalsRows[0] ?? { merged: 0, closed: 0 };

  return {
    stats: statsRows,
    actions: actionsRows,
    repos: reposRows,
    sessions: sessionsRows,
    triggerRuns: triggerRows,
    totalMerged: totals.merged ?? 0,
    totalClosed: totals.closed ?? 0,
  };
}

const TabBar: React.FC<{
  tab: Tab;
  setTab: (t: Tab) => void;
  repoCount: number;
  refreshing: boolean;
  lastRefresh: Date | null;
  onRefresh: () => void;
}> = ({ tab, setTab, repoCount, refreshing, lastRefresh, onRefresh }) => (
  <div className="navbar bg-base-200 px-3 py-1 min-h-0 border-b border-base-300">
    <div className="flex-1">
      <div className="tabs tabs-boxed bg-transparent gap-1">
        <button
          className={`tab tab-sm gap-1 ${tab === 'overview' ? 'tab-active' : ''}`}
          onClick={() => setTab('overview')}
        >
          <LayoutDashboard size={14} />
          Overview
        </button>
        <button
          className={`tab tab-sm gap-1 ${tab === 'repos' ? 'tab-active' : ''}`}
          onClick={() => setTab('repos')}
        >
          <GitBranch size={14} />
          {repoCount > 0 ? `Repos (${repoCount})` : 'Repos'}
        </button>
        <button
          className={`tab tab-sm gap-1 ${tab === 'activity' ? 'tab-active' : ''}`}
          onClick={() => setTab('activity')}
        >
          <Activity size={14} />
          Activity
        </button>
      </div>
    </div>
    <div className="flex items-center gap-2">
      {lastRefresh && (
        <span className="text-xs text-base-content/40">
          {lastRefresh.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
      <button
        className="btn btn-ghost btn-xs"
        onClick={onRefresh}
        disabled={refreshing}
      >
        {refreshing
          ? <span className="loading loading-spinner loading-xs" />
          : <RefreshCw size={12} />}
      </button>
    </div>
  </div>
);

const App: React.FC = () => {
  const [tab, setTab] = useState<Tab>('overview');
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  async function refresh() {
    setRefreshing(true);
    try {
      const d = await loadData();
      setData(d);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      <TabBar
        tab={tab}
        setTab={setTab}
        repoCount={data?.repos.length ?? 0}
        refreshing={refreshing}
        lastRefresh={lastRefresh}
        onRefresh={refresh}
      />

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <span className="loading loading-spinner loading-lg text-primary" />
            <span className="text-base-content/50 text-sm">Loading dashboard data...</span>
          </div>
        ) : !data ? (
          <div className="alert alert-error">
            <span>Failed to load data. Check the console for details.</span>
          </div>
        ) : tab === 'overview' ? (
          <Overview
            stats={data.stats}
            triggerRuns={data.triggerRuns}
            totalMerged={data.totalMerged}
            totalClosed={data.totalClosed}
          />
        ) : tab === 'repos' ? (
          <RepoGrid repos={data.repos} />
        ) : (
          <ActivityFeed actions={data.actions} sessions={data.sessions} />
        )}
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
