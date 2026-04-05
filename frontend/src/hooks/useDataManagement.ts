import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { DataExport, ImportResult, ResetResult } from '../types';
import { payPeriodKeys } from './usePayPeriods';
import { categoryKeys } from './useCategories';
import { billKeys } from './useBills';
import { spendingKeys } from './useSpending';
import { billTemplateKeys } from './useBillTemplates';

const API_BASE = '/api';

/**
 * Hook for exporting all user data.
 * Returns a mutation that fetches and downloads the export file.
 */
export function useExportData() {
  return useMutation({
    mutationFn: async (): Promise<DataExport> => {
      const response = await fetch(`${API_BASE}/data/export`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(typeof error.error === 'string' ? error.error : 'Export failed');
      }
      return response.json();
    },
  });
}

/**
 * Download data as a JSON file.
 */
export function downloadExportFile(data: DataExport): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().split('T')[0];
  const filename = `rae-budget-export-${date}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Hook for importing data from a previously exported JSON file.
 */
export function useImportData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DataExport) =>
      api.post<ImportResult>('/data/import', data),
    onSuccess: () => {
      // Invalidate all data queries to refresh UI
      queryClient.invalidateQueries({ queryKey: payPeriodKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      queryClient.invalidateQueries({ queryKey: billKeys.all });
      queryClient.invalidateQueries({ queryKey: spendingKeys.all });
      queryClient.invalidateQueries({ queryKey: billTemplateKeys.all });
    },
  });
}

/**
 * Hook for resetting (deleting) all user data.
 */
export function useResetData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<ResetResult> => {
      const response = await fetch(`${API_BASE}/data/reset`, {
        method: 'DELETE',
        headers: {
          'X-Confirm-Reset': 'DELETE-ALL-DATA',
        },
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(typeof error.error === 'string' ? error.error : 'Reset failed');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all data queries to refresh UI
      queryClient.invalidateQueries({ queryKey: payPeriodKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      queryClient.invalidateQueries({ queryKey: billKeys.all });
      queryClient.invalidateQueries({ queryKey: spendingKeys.all });
      queryClient.invalidateQueries({ queryKey: billTemplateKeys.all });
    },
  });
}

/**
 * Parse and validate a JSON file as export data.
 */
export async function parseExportFile(file: File): Promise<DataExport> {
  const text = await file.text();
  const data = JSON.parse(text) as DataExport;

  // Basic validation
  if (!data.export_version || !data.export_date || !data.data) {
    throw new Error('Invalid export file format');
  }
  if (!data.data.categories || !data.data.bill_templates || !data.data.pay_periods) {
    throw new Error('Invalid export file format: missing required data sections');
  }

  return data;
}
