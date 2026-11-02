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
        { apiName: 'completed', label: 'Completed', type: 'bool', isPrimaryKey: false },
        { apiName: 'sessionDate', label: 'Session Date', type: 'date', isPrimaryKey: false },
      ],
    },
    rows: [
      { trainerId: 'coach-sam', traineeId: 'Ana', reps: 120, minutes: 45, completed: true, sessionDate: '2024-03-01' },
      { trainerId: 'coach-sam', traineeId: 'Ana', reps: 90, minutes: 30, completed: true, sessionDate: '2024-03-08' },
      { trainerId: 'coach-sam', traineeId: 'Bo', reps: 60, minutes: 25, completed: false, sessionDate: '2024-02-10' },
      { trainerId: 'coach-sam', traineeId: 'Cy', reps: 200, minutes: 60, completed: true, sessionDate: '2024-03-15' },
      { trainerId: 'coach-sam', traineeId: 'Cy', reps: 75, minutes: 20, completed: false, sessionDate: '2024-01-20' },
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
  {
    source: { id: 'visits', name: 'Field Visits', enabled: true },
    describe: {
      type: 'visit',
      fields: [
        { apiName: 'territory', label: 'Territory', type: 'geography', isPrimaryKey: false },
        { apiName: 'rep', label: 'Rep', type: 'text', isPrimaryKey: false },
        { apiName: 'latitude', label: 'Latitude', type: 'number', isPrimaryKey: false },
        { apiName: 'longitude', label: 'Longitude', type: 'number', isPrimaryKey: false },
      ],
    },
    rows: [
      { territory: 'North', rep: 'Ana', latitude: 44.98, longitude: -93.27 },
      { territory: 'North', rep: 'Bo', latitude: 44.95, longitude: -93.1 },
      { territory: 'South', rep: 'Cy', latitude: 29.76, longitude: -95.37 },
    ],
  },
];
