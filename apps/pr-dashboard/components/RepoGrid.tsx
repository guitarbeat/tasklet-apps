import React, { useEffect, useState } from 'react';
import { GitPullRequest, RefreshCw, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { MonitoredRepo } from '../types';

interface RepoCard {
  repo: MonitoredRepo;
  prCount: number | null;
  loading: boolean;
  error: boolean;
}

interface RepoGridProps {
  repos: MonitoredRepo[];
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'badge-error',
  high: 'badge-warning',
  medium: 'badge-info',
  low: 'badge-ghost',
};

const StatusIcon: React.FC<{ prCount: number | null; loading: boolean; error: boolean }> = ({ prCount, loading, error }) => {
  if (loading) return <span className="loading loading-spinner loading-xs opacity-50" />;
  if (error) return <AlertTriangle size={14} className="text-warning opacity-70" />;
  if (prCount === 0) return <CheckCircle size={14} className="text-success opacity-80" />;
  if (prCount !== null && prCount > 0) return <GitPullRequest size={14} className="text-warning opacity-80" />;
  return <Clock size={14} className="opacity-40" />;
};

export const RepoGrid: React.FC<RepoGridProps> = ({ repos }) => {
  const [cards, setCards] = useState<RepoCard[]>(
    repos.map(r => ({ repo: r, prCount: null, loading: true, error: false }))
  );
  const [refreshing, setRefreshing] = useState(false);

  async function fetchPRCounts(repoList: MonitoredRepo[]) {
    const updated = await Promise.all(
      repoList.map(async (r) => {
        try {
          const result = await window.tasklet.runTool(
            'conn_r14eh5w3h2hnxbdggsx8__github_list_pull_requests',
            { owner: r.owner, repo: r.repo, state: 'open', per_page: 50, readMask: ['dates'] }
          );
          let count = 0;
          if (Array.isArray(result)) {
            count = result.length;
          }
          return { repo: r, prCount: count, loading: false, error: false };
        } catch (e) {
          console.error(`Failed to fetch PRs for ${r.repo}:`, e);
          return { repo: r, prCount: null, loading: false, error: true };
        }
      })
    );
    return updated;
  }

  useEffect(() => {
    fetchPRCounts(repos).then(setCards);
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    setCards(repos.map(r => ({ repo: r, prCount: null, loading: true, error: false })));
    const updated = await fetchPRCounts(repos);
    setCards(updated);
    setRefreshing(false);
  }

  const cleanCount = cards.filter(c => c.prCount === 0).length;
  const totalOpen = cards.reduce((sum, c) => sum + (c.prCount ?? 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-3 text-sm">
          <span className="text-success">{cleanCount} clean</span>
          <span className="text-base-content/40">·</span>
          <span className="text-warning">{totalOpen} open PRs</span>
        </div>
        <button
          className="btn btn-ghost btn-xs gap-1"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing
            ? <span className="loading loading-spinner loading-xs" />
            : <RefreshCw size={12} />}
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {cards.map(({ repo, prCount, loading, error }) => (
          <div key={repo.repo} className="card bg-base-200 hover:bg-base-300 transition-colors">
            <div className="card-body p-3 flex-row items-center gap-3">
              <StatusIcon prCount={prCount} loading={loading} error={error} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{repo.repo}</span>
                  <span className={`badge badge-xs ${PRIORITY_COLORS[repo.priority] ?? 'badge-ghost'}`}>
                    {repo.priority}
                  </span>
                </div>
                {repo.notes && (
                  <div className="text-xs text-base-content/40 truncate mt-0.5">{repo.notes}</div>
                )}
              </div>
              <div className="text-right shrink-0">
                {loading ? (
                  <span className="text-base-content/30 text-sm">—</span>
                ) : error ? (
                  <span className="text-warning text-xs">unavailable</span>
                ) : prCount === 0 ? (
                  <span className="text-success text-sm font-medium">✓ clean</span>
                ) : (
                  <span className="badge badge-warning badge-sm">{prCount} open</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
