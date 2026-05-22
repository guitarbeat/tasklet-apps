import React, { useState } from 'react';
import { GitMerge, XCircle, Search } from 'lucide-react';
import { PrAction, JulesSession } from '../types';

interface ActivityFeedProps {
  actions: PrAction[];
  sessions: JulesSession[];
}

function ActionBadge({ action }: { action: string }) {
  if (action === 'merged') {
    return (
      <span className="flex items-center gap-1 text-success text-xs">
        <GitMerge size={12} /> merged
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-error text-xs">
      <XCircle size={12} /> closed
    </span>
  );
}

function SessionStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    COMPLETED: 'badge-success',
    IN_PROGRESS: 'badge-info',
    DELETED: 'badge-ghost',
    FAILED: 'badge-error',
  };
  return <span className={`badge badge-xs ${map[status] ?? 'badge-ghost'}`}>{status}</span>;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ actions, sessions }) => {
  const [tab, setTab] = useState<'prs' | 'sessions'>('prs');
  const [search, setSearch] = useState('');

  const filteredActions = actions.filter(a =>
    !search || a.repo.includes(search) || (a.title ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredSessions = sessions.filter(s =>
    !search || s.repo.includes(search) || (s.focus ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="tabs tabs-boxed">
        <a className={`tab tab-sm ${tab === 'prs' ? 'tab-active' : ''}`} onClick={() => setTab('prs')}>
          PR Actions ({actions.length})
        </a>
        <a className={`tab tab-sm ${tab === 'sessions' ? 'tab-active' : ''}`} onClick={() => setTab('sessions')}>
          Sessions ({sessions.length})
        </a>
      </div>

      <label className="input input-bordered input-sm flex items-center gap-2">
        <Search className="h-[1em] opacity-50" />
        <input
          type="search"
          className="grow"
          placeholder="Filter by repo or title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </label>

      {tab === 'prs' && (
        filteredActions.length === 0 ? (
          <div className="text-center py-8 text-base-content/40 text-sm">No actions recorded</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-xs table-zebra">
              <thead>
                <tr><th>Repo</th><th>PR</th><th>Action</th><th>Reason</th><th>Time</th></tr>
              </thead>
              <tbody>
                {filteredActions.map(a => (
                  <tr key={a.id}>
                    <td className="font-mono text-xs max-w-28 truncate">{a.repo}</td>
                    <td className="text-base-content/60">#{a.pr_number}</td>
                    <td><ActionBadge action={a.action} /></td>
                    <td className="text-xs text-base-content/50 max-w-32 truncate">{a.reason}</td>
                    <td className="text-xs text-base-content/40 whitespace-nowrap">
                      {a.created_at ? new Date(a.created_at + 'Z').toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'sessions' && (
        filteredSessions.length === 0 ? (
          <div className="text-center py-8 text-base-content/40 text-sm">No sessions recorded</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-xs table-zebra">
              <thead>
                <tr><th>Repo</th><th>Focus</th><th>Status</th><th>PR</th><th>Created</th></tr>
              </thead>
              <tbody>
                {filteredSessions.map(s => (
                  <tr key={s.session_id}>
                    <td className="font-mono text-xs max-w-28 truncate">{s.repo}</td>
                    <td className="text-xs text-base-content/60 max-w-36 truncate">{s.focus ?? '—'}</td>
                    <td><SessionStatusBadge status={s.status} /></td>
                    <td className="text-base-content/50 text-xs">{s.pr_number ? `#${s.pr_number}` : '—'}</td>
                    <td className="text-xs text-base-content/40 whitespace-nowrap">
                      {s.created_at ? new Date(s.created_at + 'Z').toLocaleString(undefined, { month: 'short', day: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};
