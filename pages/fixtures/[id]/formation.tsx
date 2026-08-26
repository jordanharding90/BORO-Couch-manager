import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import FormationEditor from '../../../components/FormationEditor';
import { useSession } from 'next-auth/react';

export default function FormationPage() {
  const router = useRouter();
  const { id } = router.query; // fixture id
  const { data: session } = useSession();
  const [squad, setSquad] = useState<any[]>([]);
  const [savedSelection, setSavedSelection] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const sq = await fetch('/api/squad/latest').then((r) => r.json());
        const players = sq.players || sq;
        if (!cancelled) setSquad(players);

        if (session) {
          const selRes = await fetch(`/api/selections?fixtureId=${encodeURIComponent(id as string)}`);
          const selJson = await selRes.json();
          if (!cancelled) setSavedSelection(selJson.selection || null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id, session]);

  async function handleSave(payload: any) {
    try {
      const res = await fetch('/api/selections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.errors?.join?.('\n') || data?.error || 'Failed to save');
        return;
      }
      setMessage('Selection saved successfully');
      setSavedSelection(data.selection);
    } catch (err: any) {
      setMessage(err.message || 'Save failed');
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;

  if (!session) return (
    <div className="p-6">
      <h2 className="text-xl font-semibold">Sign in to edit formations</h2>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Formation editor — Fixture {id}</h1>
      {message && <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200">{message}</div>}
      <FormationEditor fixtureId={Number(id)} initialFormation={(savedSelection && savedSelection.formation) || '4-4-2'} squad={squad} savedSelection={savedSelection} onSave={handleSave} />
    </div>
  );
}
