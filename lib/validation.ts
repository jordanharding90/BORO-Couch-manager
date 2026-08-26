import prisma from './prisma';

export async function validateSelection(payload: any) {
  const errors: string[] = [];
  if (!payload) {
    errors.push('Missing payload');
    return { errors };
  }
  const { fixtureId, formation, starting11, bench } = payload;
  if (!fixtureId) errors.push('fixtureId is required');
  if (!formation) errors.push('formation is required');
  if (!Array.isArray(starting11)) errors.push('starting11 must be an array');
  if (!Array.isArray(bench)) errors.push('bench must be an array');
  if (Array.isArray(starting11) && starting11.length !== 11) errors.push('starting11 must contain exactly 11 players');

  // Collect playerIds
  const playerIds = new Set<number>();
  if (Array.isArray(starting11)) {
    for (const s of starting11) {
      if (!s.playerId) errors.push('Each starting11 entry must have playerId');
      else playerIds.add(Number(s.playerId));
    }
  }
  if (Array.isArray(bench)) {
    for (const b of bench) {
      if (!b.playerId) errors.push('Each bench entry must have playerId');
      else playerIds.add(Number(b.playerId));
    }
  }

  // duplicates
  const allIds = [] as number[];
  if (Array.isArray(starting11)) starting11.forEach((s: any) => allIds.push(Number(s.playerId)));
  if (Array.isArray(bench)) bench.forEach((b: any) => allIds.push(Number(b.playerId)));
  const duplicates = allIds.filter((item, index) => allIds.indexOf(item) !== index);
  if (duplicates.length) errors.push('Duplicate playerIds in selection/bench are not allowed');

  // GK check
  if (Array.isArray(starting11)) {
    const gkCount = starting11.filter((s: any) => (s.position || '').toLowerCase().includes('gk') || (s.position || '').toLowerCase() === 'goalkeeper').length;
    if (gkCount !== 1) errors.push('starting11 must contain exactly 1 goalkeeper');
  }

  // Verify players exist in DB and belong to club (Middlesbrough) if possible
  if (playerIds.size > 0) {
    const ids = Array.from(playerIds);
    const dbPlayers = await prisma.player.findMany({ where: { id: { in: ids } } });
    const dbIds = new Set(dbPlayers.map((p) => p.id));
    const missing = ids.filter((i) => !dbIds.has(i));
    if (missing.length) errors.push(`Player IDs not found in DB: ${missing.join(', ')}`);

    // club check (optional) - warn if any player not in Middlesbrough
    const notBoro = dbPlayers.filter((p) => p.club && p.club.toLowerCase() !== 'middlesbrough');
    if (notBoro.length) errors.push('Some players are not registered as Middlesbrough squad members in the DB');
  }

  return { errors };
}
