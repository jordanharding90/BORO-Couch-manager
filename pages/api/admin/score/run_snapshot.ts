import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '../../../../lib/prisma';
import { computeAndPersistPointsForFixture } from '../../../../lib/scoring';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions as any);
  if (!session || !session.user) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { fixtureId, actuals } = req.body;
  if (!fixtureId) return res.status(400).json({ error: 'fixtureId required' });
  if (!actuals) return res.status(400).json({ error: 'actuals object required' });

  try {
    // load selections for fixture to determine affected users
    const selections = await prisma.selection.findMany({ where: { fixtureId } });
    const userIds = selections.map((s) => s.userId);

    // fetch existing PointsLog rows for these users & fixture (snapshot)
    const previous = await prisma.pointsLog.findMany({ where: { fixtureId, userId: { in: userIds } } });

    // compute and persist new points
    const results = await computeAndPersistPointsForFixture(Number(fixtureId), actuals);

    // store run with previous snapshot
    const run = await prisma.scoreRun.create({
      data: {
        fixtureId: Number(fixtureId),
        admin: (session.user as any).email,
        results: results as any,
        previous: previous as any,
      },
    });

    return res.status(200).json({ results, run });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to run scoring with snapshot' });
  }
}
