import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function AdminRunsPage() {
  const { data: session, status } = useSession();
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') return;
    setLoading(true);
    fetch('/api/admin/score/runs')
      .then((r) => r.json())
      .then((data) => setRuns(data.runs || []))
      .catch((err) => setMessage(err.message || 'Failed to load runs'))
      .finally(() => setLoading(false));
  }, [status]);

  if (status === 'loading') return <div className="p-6">Loading...</div>;
  if (!session) return (
    <div className="p-6">
      <h2 className="text-xl font-semibold">Sign in to access run history</h2>
    </div>
  );

  async function restoreRun(runId: number) {
    if (!confirm('Restore this run from snapshot? This will overwrite current PointsLog rows for the run\'s users.')) return;
    setMessage(null);
    try {
      setLoading(true);
      const res = await fetch('/api/admin/score/restore_proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runId }) });
      const data = await res.json();
      if (!res.ok) setMessage(data.error || 'Restore failed');
      else {
        setMessage(`Restored ${data.restoredCount} entries`);
        // refresh runs
        const runsRes = await fetch('/api/admin/score/runs');
        const runsJson = await runsRes.json();
        setRuns(runsJson.runs || []);
      }
    } catch (err: any) {
      setMessage(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin — Score Runs</h1>
      {message && <div className="mb-4 text-sm text-gray-700">{message}</div>}
      {loading && <div className="mb-4">Working...</div>}
      <div className="space-y-3">
        {runs.length === 0 && <div>No runs found.</div>}
        {runs.map((r) => (
          <div key={r.id} className="p-3 border rounded bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Run #{r.id} — Fixture {r.fixtureId}</div>
                <div className="text-sm text-gray-600">By {r.admin || 'system'} at {new Date(r.createdAt).toLocaleString()}</div>
              </div>
              <div className="space-x-2">
                <button className="btn-outline" onClick={() => restoreRun(r.id)} disabled={r.undone}>Restore</button>
                <a className="btn" href={`/api/admin/score/run/${r.id}`} target="_blank" rel="noreferrer">View JSON</a>
              </div>
            </div>
            <details className="mt-2">
              <summary className="text-sm">Results ({(r.results || []).length})</summary>
              <pre className="mt-2 text-sm font-mono max-h-72 overflow-auto">{JSON.stringify(r, null, 2)}</pre>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
