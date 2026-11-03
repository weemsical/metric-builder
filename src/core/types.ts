export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'bool'
  | 'object'
  | 'geography'
  | 'unknown';

export type SourceField = {
  apiName: string;
  label: string;
  type: FieldType;
  isPrimaryKey: boolean;
  nullable?: boolean;
};

export type MetricSource = {
  id: string;
  name: string;
  enabled: boolean;
};

export type SourceDescribe = {
  type: string;
  fields: SourceField[];
};

export type Coordinates = {
  lat: number;
  lng: number;
};

export type CoordinateFields = {
  latField: string;
  lngField: string;
};

export type SubjectValue = {
  subject: string;
  value: number;
  coordinates?: Coordinates;
};

export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'isTrue'
  | 'isFalse'
  | 'isNull'
  | 'isNotNull';

export type Filter = {
  field: string;
  operator: FilterOperator;
  value?: unknown;
};

export type Granularity =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'annually';

export type Window = {
  field: string;
  granularity: Granularity;
  timeZone?: string;
  weekStartsOn?: number;
};

export type Range = {
  field: string;
  lastDays: number;
};

export type SeriesPoint = {
  bucket: string;
  value: number | null;
};

export type SubjectSeries = {
  subject: string;
  points: SeriesPoint[];
};

export type Direction = 'higherIsBetter' | 'lowerIsBetter';

export type Target = {
  value?: number;
  min?: number;
  max?: number;
  direction: Direction;
};

export type Thresholds = {
  amber: number;
  green: number;
};

export type RagStatus = 'red' | 'amber' | 'green';

export type PacingStrategy = 'steady' | 'rampUp' | 'bigFinish';

export type Pacing = {
  strategy: PacingStrategy;
  excludeWeekends?: boolean;
};

export type RankMethod = 'score' | 'percentToGoal';

export type FormulaOp = 'add' | 'subtract' | 'multiply' | 'divide';
