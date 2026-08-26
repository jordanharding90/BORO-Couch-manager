import prisma from '../../lib/prisma';

export async function performRestore(prismaClient: any, runId: number, options?: { admin?: string; userIds?: number[] }) {
  const run = await prismaClient.scoreRun.findUnique({ where: { id: Number(runId) } });
  if (!run) throw new Error('ScoreRun not found');
  if (!run.previous) throw new Error('No previous snapshot found for this run');

  const previous: any[] = run.previous as any[];
  const fixtureId = run.fixtureId;
  let toRestore = previous;

  if (options?.userIds && options.userIds.length > 0) {
    const set = new Set(options.userIds.map((id) => Number(id)));
    toRestore = previous.filter((p) => set.has(Number(p.userId)));
  }

  for (const p of toRestore) {
    await prismaClient.pointsLog.deleteMany({ where: { fixtureId: fixtureId, userId: p.userId } });
    await prismaClient.pointsLog.create({
      data: {
        userId: p.userId,
        fixtureId: p.fixtureId,
        points: p.points,
        breakdown: p.breakdown,
        createdAt: p.createdAt || undefined,
      },
    });
  }

  const updated = await prismaClient.scoreRun.update({ where: { id: Number(runId) }, data: { undone: true, undoneAt: new Date() } });

  // write audit record
  try {
    await prismaClient.audit.create({
      data: {
        runId: updated.id,
        action: options?.userIds && options.userIds.length > 0 ? 'partial_restore' : 'restore',
        admin: options?.admin || undefined,
        details: { restoredCount: toRestore.length, userIds: toRestore.map((p) => p.userId) },
      },
    });
  } catch (e) {
    console.warn('Failed to write audit record', e);
  }

  return { restoredCount: toRestore.length, run: updated };
}
