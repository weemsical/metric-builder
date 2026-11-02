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

export type SubjectValue = {
  subject: string;
  value: number;
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
