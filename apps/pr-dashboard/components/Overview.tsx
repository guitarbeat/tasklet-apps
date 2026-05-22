import React from 'react';
import { GitMerge, XCircle, Activity, Shield } from 'lucide-react';
import { DailyStat, TriggerRun } from '../types';

interface OverviewProps {
  stats: DailyStat[];
  triggerRuns: TriggerRun[];
  totalMerged: number;
  totalClosed: number;
}

const PRIORITY_ORDER = ['critical', 'high', 'medium', 'low'];

function BarChart({ stats }: { stats: DailyStat[] }) {
  const last7 = stats.slice(0, 7).reverse();
  if (last7.length === 0) return <div className="text-base-content/40 text-sm text-center py-8">No data yet</div>;

  const maxVal = Math.max(...last7.map(s => s.prs_merged + s.prs_closed), 1);

  return (
    <div className="flex items-end gap-2 h-28 w-full">
      {last7.map((s) => {
        const mergedPct = (s.prs_merged / maxVal) * 100;
        const closedPct = (s.prs_closed / maxVal) * 100;
        const label = s.date.slice(5); // MM-DD
        return (
          <div key={s.date} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col justify-end gap-px" style={{ height: '88px' }}>
              <div
                className="w-full bg-error/60 rounded-sm transition-all"
                style={{ height: `${closedPct}%` }}
                title={`Closed: ${s.prs_closed}`}
              />
              <div
                className="w-full bg-success/70 rounded-sm transition-all"
                style={{ height: `${mergedPct}%` }}
                title={`Merged: ${s.prs_merged}`}
              />
            </div>
            <span className="text-base-content/40 text-xs">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export const Overview: React.FC<OverviewProps> = ({ stats, triggerRuns, totalMerged, totalClosed }) => {
  const today = stats[0];
  const lastRun = triggerRuns[0];
  const lastRunTime = lastRun
    ? new Date(lastRun.timestamp + 'Z').toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Never';

  const triggerAge = lastRun
    ? Math.round((Date.now() - new Date(lastRun.timestamp + 'Z').getTime()) / 60000)
    : null;

  const triggerHealthy = triggerAge !== null && triggerAge < 40;

  return (
    <div className="space-y-4">
      {/* Trigger status banner */}
      <div className={`alert ${triggerHealthy ? 'alert-success' : 'alert-warning'} py-2`}>
        <Activity size={16} />
        <span className="text-sm">
          {triggerHealthy
            ? `✅ Trigger healthy — last run ${triggerAge}m ago`
            : triggerAge !== null
            ? `⚠️ Trigger may be stale — last run ${triggerAge}m ago (expected ≤30m)`
            : '⚠️ No trigger runs recorded'}
        </span>
        {lastRun && (
          <span className="text-xs opacity-60 ml-auto">{lastRunTime}</span>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card bg-base-200">
          <div className="card-body p-4">
            <div className="flex items-center gap-2">
              <GitMerge size={18} className="text-success opacity-80" />
              <span className="text-base-content/60 text-sm">Total Merged</span>
            </div>
            <div className="text-3xl font-bold text-success">{totalMerged.toLocaleString()}</div>
            {today && <div className="text-xs text-base-content/40">+{today.prs_merged} today</div>}
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body p-4">
            <div className="flex items-center gap-2">
              <XCircle size={18} className="text-error opacity-80" />
              <span className="text-base-content/60 text-sm">Total Closed</span>
            </div>
            <div className="text-3xl font-bold text-error">{totalClosed.toLocaleString()}</div>
            {today && <div className="text-xs text-base-content/40">+{today.prs_closed} today</div>}
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body p-4">
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-warning opacity-80" />
              <span className="text-base-content/60 text-sm">Trigger Runs</span>
            </div>
            <div className="text-3xl font-bold">{triggerRuns.length}</div>
            <div className="text-xs text-base-content/40">last 5 logged</div>
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body p-4">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-primary opacity-80" />
              <span className="text-base-content/60 text-sm">PRs Processed</span>
            </div>
            <div className="text-3xl font-bold">{(totalMerged + totalClosed).toLocaleString()}</div>
            <div className="text-xs text-base-content/40">all time</div>
          </div>
        </div>
      </div>

      {/* 7-day chart */}
      <div className="card bg-base-200">
        <div className="card-body p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">7-Day Activity</span>
            <div className="flex gap-3 text-xs text-base-content/60">
              <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-success/70"></span>Merged</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-error/60"></span>Closed</span>
            </div>
          </div>
          <BarChart stats={stats} />
        </div>
      </div>

      {/* Recent trigger runs */}
      {triggerRuns.length > 0 && (
        <div className="card bg-base-200">
          <div className="card-body p-4">
            <span className="text-sm font-medium mb-2 block">Recent Trigger Runs</span>
            <table className="table table-xs">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Repos</th>
                  <th>PRs</th>
                  <th>Errors</th>
                </tr>
              </thead>
              <tbody>
                {triggerRuns.map((run) => (
                  <tr key={run.run_id}>
                    <td className="text-base-content/60 text-xs">
                      {new Date(run.timestamp + 'Z').toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>{run.repos_scanned}</td>
                    <td>{run.prs_processed}</td>
                    <td className={run.errors ? 'text-warning text-xs truncate max-w-32' : 'text-success text-xs'}>
                      {run.errors ? run.errors.slice(0, 40) : '✓'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
