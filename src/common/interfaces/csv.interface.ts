// src/common/interfaces/csv.interface.ts
import { ItemResponseDto } from './item.interface';

export interface CSVImportResult {
  success: boolean;
  data: ItemResponseDto[];
  errors: string[];
  totalProcessed: number;
  totalImported: number;
}

export interface CSVExportOptions {
  includeHeaders?: boolean;
  selectedItems?: string[]; // item codes
  delimiter?: string;
}

export interface CSVImportResponse {
  message: string;
  result: CSVImportResult;
  timestamp: Date;
}

export interface CSVExportResponse {
  csvContent: string;
  filename: string;
  timestamp?: Date;
}
