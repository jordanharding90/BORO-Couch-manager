import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../lib/prisma';
import { sendRestoreNotification } from '../../../../lib/notifications';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) return res.status(500).json({ error: 'Server misconfigured: ADMIN_SECRET missing' });
  const provided = req.headers['x-admin-secret'] || req.body?.adminSecret;
  if (!provided || provided !== adminSecret) return res.status(401).json({ error: 'Unauthorized — invalid admin secret' });

  const { runId } = req.body;
  if (!runId) return res.status(400).json({ error: 'runId required' });

  try {
    const run = await prisma.scoreRun.findUnique({ where: { id: Number(runId) } });
    if (!run) return res.status(404).json({ error: 'ScoreRun not found' });
    if (!run.previous) return res.status(400).json({ error: 'No previous snapshot found for this run' });

    const previous: any[] = run.previous as any[];
    const fixtureId = run.fixtureId;

    for (const p of previous) {
      await prisma.pointsLog.deleteMany({ where: { fixtureId: fixtureId, userId: p.userId } });
      await prisma.pointsLog.create({
        data: {
          userId: p.userId,
          fixtureId: p.fixtureId,
          points: p.points,
          breakdown: p.breakdown,
          createdAt: p.createdAt || undefined,
        },
      });
    }

    const updated = await prisma.scoreRun.update({ where: { id: Number(runId) }, data: { undone: true, undoneAt: new Date() } });

    // send notification (best-effort)
    try {
      await sendRestoreNotification(updated);
    } catch (e) {
      console.warn('Failed to send restore notification', e);
    }

    return res.status(200).json({ restoredCount: previous.length, run: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to restore run and notify' });
  }
}
