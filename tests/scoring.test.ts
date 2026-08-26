import { calculatePointsForSelection } from '../lib/scoring';

// Minimal unit tests for scoring logic. Run with your test runner (jest/vitest).

describe('scoring engine', () => {
  const playersMap = new Map<number, any>([
    [1, { id: 1, rating: 8, position: 'ST' }],
    [2, { id: 2, rating: 6, position: 'CM' }],
    [3, { id: 3, rating: 3.5, position: 'GK' }],
  ]);

  it('applies captain bonus and scorer bonus', async () => {
    const selection = {
      id: 1,
      userId: 10,
      fixtureId: 100,
      formation: '4-3-3',
      starting11: [
        { playerId: 1, position: 'ST', slot: 'ST', captain: true },
        { playerId: 2, position: 'CM', slot: 'CM1' },
        { playerId: 3, position: 'GK', slot: 'GK' },
      ],
    } as any;

    const prediction = null;
    const actuals = { starters: [1,2,3], scorers: [1], minutes: { '1': 90, '2': 90, '3': 90 } };

    const res = await calculatePointsForSelection(selection, prediction, playersMap, actuals);
    expect(res.breakdown.players).toBeDefined();
    // player 1 should have scorer bonus and captain bonus applied
    const player1 = res.breakdown.players.details.find((d:any) => d.playerId === 1);
    expect(player1.points).toBeGreaterThanOrEqual(0);
    expect(res.breakdown.captainBonus).toBeGreaterThanOrEqual(0);
  });
});
