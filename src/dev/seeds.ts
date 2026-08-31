import type { MockSourceSeed } from '../core';

export const seeds: MockSourceSeed[] = [
  {
    source: { id: 'gym', name: 'Gym Sessions', enabled: true },
    describe: {
      type: 'session',
      fields: [
        { apiName: 'trainerId', label: 'Trainer', type: 'text', isPrimaryKey: false },
        { apiName: 'traineeId', label: 'Trainee', type: 'text', isPrimaryKey: false },
        { apiName: 'reps', label: 'Reps', type: 'number', isPrimaryKey: false },
        { apiName: 'minutes', label: 'Minutes', type: 'number', isPrimaryKey: false },
      ],
    },
    rows: [
      { trainerId: 'coach-sam', traineeId: 'Ana', reps: 120, minutes: 45 },
      { trainerId: 'coach-sam', traineeId: 'Ana', reps: 90, minutes: 30 },
      { trainerId: 'coach-sam', traineeId: 'Bo', reps: 60, minutes: 25 },
      { trainerId: 'coach-sam', traineeId: 'Cy', reps: 200, minutes: 60 },
      { trainerId: 'coach-sam', traineeId: 'Cy', reps: 75, minutes: 20 },
    ],
  },
  {
    source: { id: 'crm', name: 'Sales Activity', enabled: true },
    describe: {
      type: 'activity',
      fields: [
        { apiName: 'ownerId', label: 'Owner', type: 'text', isPrimaryKey: false },
        { apiName: 'amount', label: 'Amount', type: 'number', isPrimaryKey: false },
        { apiName: 'stage', label: 'Stage', type: 'text', isPrimaryKey: false },
      ],
    },
    rows: [
      { ownerId: 'Jordan', amount: 5000, stage: 'won' },
      { ownerId: 'Jordan', amount: 2500, stage: 'won' },
      { ownerId: 'Kim', amount: 8000, stage: 'won' },
      { ownerId: 'Lee', amount: 1500, stage: 'won' },
    ],
  },
];
