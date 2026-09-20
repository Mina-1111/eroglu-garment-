export type ColumnDataType = 'number' | 'string' | 'date' | 'boolean';

export interface ColumnProfile {
  name: string;
  type: ColumnDataType;
  sampleValues: (string | number | boolean)[];
  distinctCount: number;
  distinctValues: string[];
  totalValues: number;
  nullCount: number;
  // For numeric columns
  min?: number;
  max?: number;
  sum?: number;
  avg?: number;
  median?: number;
}

export interface SheetData {
  sheetName: string;
  rowCount: number;
  columnCount: number;
  columns: ColumnProfile[];
  rawRows: Record<string, any>[];
}

export interface UniversalDataset {
  fileName: string;
  fileSize?: string;
  sheetNames: string[];
  activeSheetName: string;
  sheets: Record<string, SheetData>;
  uploadedAt: string;
}

export type AggregationType = 'sum' | 'avg' | 'count' | 'max' | 'min';

export type VisualType = 'bar' | 'column' | 'line' | 'area' | 'donut' | 'pie' | 'matrix';

export interface CustomVisualConfig {
  id: string;
  title: string;
  type: VisualType;
  dimensionColumn: string; // X-axis / Category
  measureColumn: string;   // Y-axis / Value
  aggregation: AggregationType;
}

export interface FilterState {
  [columnName: string]: string[]; // selected values for categorical columns
}

export interface QuickInsightItem {
  id: string;
  type: 'highlight' | 'trend' | 'outlier' | 'distribution';
  title: string;
  description: string;
  metric?: string;
}

export interface DepartmentSummary {
  department: string;
  headcount: number;
  sharePercentage: number;
  totalWorkingHours: number;
  regularHours: number;
  overtimeHours: number;
  avgHoursPerPerson: number;
  totalSalary: number;
  avgSalary: number;
  avgEfficiency: number;
}
