import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '../../../../lib/prisma';
import { calculatePointsForSelection } from '../../../../lib/scoring';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) return res.status(500).json({ error: 'Server not configured: ADMIN_SECRET missing' });

  const provided = req.headers['x-admin-secret'] || req.body?.adminSecret;
  if (!provided || provided !== adminSecret) return res.status(401).json({ error: 'Unauthorized — invalid admin secret' });

  const { fixtureId, actuals } = req.body;
  if (!fixtureId) return res.status(400).json({ error: 'fixtureId required' });
  if (!actuals) return res.status(400).json({ error: 'actuals object required' });

  try {
    // load players map
    const allPlayers = await prisma.player.findMany();
    const playersMap = new Map<number, any>(allPlayers.map((p) => [p.id, p]));

    // load all selections for fixture
    const selections = await prisma.selection.findMany({ where: { fixtureId } });

    // load predictions for fixture
    const predictions = await prisma.prediction.findMany({ where: { fixtureId } });
    const predictionsMap = new Map<number, any>(predictions.map((p) => [p.userId, p]));

    const results: Array<{ userId: number; points: number; breakdown: any }> = [];

    for (const sel of selections) {
      const selRow = {
        id: sel.id,
        userId: sel.userId,
        fixtureId: sel.fixtureId,
        formation: sel.formation,
        starting11: sel.starting11 as any,
        bench: (sel as any).bench as any,
      };
      const prediction = predictionsMap.get(sel.userId) || null;
      const resCalc = await calculatePointsForSelection(selRow, prediction, playersMap, actuals);
      results.push({ userId: sel.userId, points: resCalc.total, breakdown: resCalc.breakdown });
    }

    return res.status(200).json({ results });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to compute preview' });
  }
}
