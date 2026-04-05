import { useState, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';
import {
  useExportData,
  useImportData,
  useRepopulateBills,
  useResetData,
  downloadExportFile,
  parseExportFile,
} from '../hooks/useDataManagement';
import type { DataExport } from '../types';

export function DataManagement() {
  return (
    <div className="space-y-6">
      <ExportSection />
      <div className="divider" />
      <ImportSection />
      <div className="divider" />
      <RepopulateBillsSection />
      <div className="divider" />
      <ResetSection />
    </div>
  );
}

function ExportSection() {
  const { showToast } = useToast();
  const exportData = useExportData();

  const handleExport = () => {
    exportData.mutate(undefined, {
      onSuccess: (data) => {
        downloadExportFile(data);
        showToast('Data exported successfully', 'success');
      },
      onError: (error) => {
        showToast(
          error instanceof Error ? error.message : 'Failed to export data',
          'error'
        );
      },
    });
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Export Data</h3>
      <p className="text-sm text-base-content/70 mb-4">
        Download all your data as a JSON file. This includes categories, bill
        templates, pay periods, bills, and spending entries.
      </p>
      <button
        className="btn btn-primary"
        onClick={handleExport}
        disabled={exportData.isPending}
      >
        {exportData.isPending ? (
          <>
            <span className="loading loading-spinner loading-sm"></span>
            Exporting...
          </>
        ) : (
          'Export Data'
        )}
      </button>
    </div>
  );
}

function ImportSection() {
  const { showToast } = useToast();
  const importData = useImportData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedData, setParsedData] = useState<DataExport | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setParsedData(null);
      setParseError(null);
      return;
    }

    setParseError(null);

    try {
      const data = await parseExportFile(file);
      setParsedData(data);
    } catch (error) {
      setParseError(
        error instanceof Error ? error.message : 'Failed to parse file'
      );
      setParsedData(null);
    }
  };

  const handleImportClick = () => {
    if (parsedData) {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmImport = () => {
    if (!parsedData) return;

    importData.mutate(parsedData, {
      onSuccess: (result) => {
        const totalCreated =
          result.categories_created +
          result.bill_templates_created +
          result.pay_periods_created +
          result.bills_created +
          result.spending_entries_created;

        showToast(
          `Successfully imported ${totalCreated} items`,
          'success'
        );
        setShowConfirmModal(false);
        setParsedData(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      onError: (error) => {
        showToast(
          error instanceof Error ? error.message : 'Failed to import data',
          'error'
        );
      },
    });
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Import Data</h3>
      <p className="text-sm text-base-content/70 mb-4">
        Import data from a previously exported JSON file. Existing categories
        and bill templates with the same name will be skipped. Pay periods will
        always be created as new entries.
      </p>

      <div className="flex flex-col gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="file-input file-input-bordered w-full max-w-xs"
          onChange={handleFileChange}
        />

        {parseError && (
          <div className="alert alert-error">
            <span>{parseError}</span>
          </div>
        )}

        {parsedData && (
          <div className="bg-base-200 rounded-lg p-4">
            <h4 className="font-medium mb-2">File Preview</h4>
            <ul className="text-sm space-y-1">
              <li>Categories: {parsedData.data.categories.length}</li>
              <li>Bill Templates: {parsedData.data.bill_templates.length}</li>
              <li>Pay Periods: {parsedData.data.pay_periods.length}</li>
              <li>
                Bills:{' '}
                {parsedData.data.pay_periods.reduce(
                  (sum, pp) => sum + pp.bills.length,
                  0
                )}
              </li>
              <li>
                Spending Entries:{' '}
                {parsedData.data.pay_periods.reduce(
                  (sum, pp) => sum + pp.spending_entries.length,
                  0
                )}
              </li>
            </ul>
          </div>
        )}

        <button
          className="btn btn-primary w-fit"
          onClick={handleImportClick}
          disabled={!parsedData || importData.isPending}
        >
          Import Data
        </button>
      </div>

      {/* Import Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirm Import</h3>
            <p className="py-4">
              Are you sure you want to import this data? This will add new pay
              periods and may create new categories and bill templates.
            </p>
            <div className="modal-action">
              <button
                className="btn"
                onClick={() => setShowConfirmModal(false)}
                disabled={importData.isPending}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmImport}
                disabled={importData.isPending}
              >
                {importData.isPending ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Importing...
                  </>
                ) : (
                  'Confirm Import'
                )}
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => !importData.isPending && setShowConfirmModal(false)}
          />
        </div>
      )}
    </div>
  );
}

function RepopulateBillsSection() {
  const { showToast } = useToast();
  const repopulateBills = useRepopulateBills();
  const [showModal, setShowModal] = useState(false);

  const handleRepopulateClick = () => {
    setShowModal(true);
  };

  const handleConfirmRepopulate = () => {
    repopulateBills.mutate(undefined, {
      onSuccess: (result) => {
        showToast(
          `Updated ${result.pay_periods_updated} pay periods: removed ${result.total_bills_deleted} bills, created ${result.total_bills_created} bills`,
          'success'
        );
        setShowModal(false);
      },
      onError: (error) => {
        showToast(
          error instanceof Error ? error.message : 'Failed to repopulate bills',
          'error'
        );
      },
    });
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Re-populate Bills</h3>
      <p className="text-sm text-base-content/70 mb-4">
        Re-assign bills to pay periods based on their due dates. This will remove
        template-based bills that don't belong in each pay period and add ones that do.
        Manually-added bills (not from templates) will be preserved.
      </p>
      <button className="btn btn-warning" onClick={handleRepopulateClick}>
        Re-populate All Bills
      </button>

      {/* Repopulate Confirmation Modal */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirm Re-populate Bills</h3>
            <div className="py-4 space-y-4">
              <div className="alert alert-warning">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span>
                  This will re-assign bills for ALL pay periods based on due dates.
                </span>
              </div>
              <p className="text-sm">
                For each pay period, this will:
              </p>
              <ul className="text-sm list-disc list-inside space-y-1 ml-2">
                <li>Remove bills from templates whose due dates fall outside the pay period</li>
                <li>Add bills from templates whose due dates fall within the pay period</li>
                <li>Preserve any manually-added bills</li>
                <li>Preserve payment status and notes will be reset for re-created bills</li>
              </ul>
            </div>
            <div className="modal-action">
              <button
                className="btn"
                onClick={() => setShowModal(false)}
                disabled={repopulateBills.isPending}
              >
                Cancel
              </button>
              <button
                className="btn btn-warning"
                onClick={handleConfirmRepopulate}
                disabled={repopulateBills.isPending}
              >
                {repopulateBills.isPending ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Re-populating...
                  </>
                ) : (
                  'Confirm Re-populate'
                )}
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => !repopulateBills.isPending && setShowModal(false)}
          />
        </div>
      )}
    </div>
  );
}

function ResetSection() {
  const { showToast } = useToast();
  const resetData = useResetData();
  const [showModal, setShowModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleResetClick = () => {
    setShowModal(true);
    setConfirmText('');
  };

  const handleConfirmReset = () => {
    resetData.mutate(undefined, {
      onSuccess: (result) => {
        const totalDeleted =
          result.categories_deleted +
          result.bill_templates_deleted +
          result.pay_periods_deleted +
          result.bills_deleted +
          result.spending_entries_deleted;

        showToast(`Successfully deleted ${totalDeleted} items`, 'success');
        setShowModal(false);
        setConfirmText('');
      },
      onError: (error) => {
        showToast(
          error instanceof Error ? error.message : 'Failed to reset data',
          'error'
        );
      },
    });
  };

  const isConfirmEnabled = confirmText === 'DELETE';

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-error">Reset All Data</h3>
      <p className="text-sm text-base-content/70 mb-4">
        Permanently delete all your data including categories, bill templates,
        pay periods, bills, and spending entries. This action cannot be undone.
      </p>
      <button className="btn btn-error" onClick={handleResetClick}>
        Reset All Data
      </button>

      {/* Reset Confirmation Modal */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-error">
              Warning: Data Deletion
            </h3>
            <div className="py-4 space-y-4">
              <div className="alert alert-warning">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span>
                  This will permanently delete ALL your data. There is no undo.
                </span>
              </div>
              <p>
                To confirm, please type <strong>DELETE</strong> below:
              </p>
              <input
                type="text"
                className="input input-bordered w-full"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                autoComplete="off"
              />
            </div>
            <div className="modal-action">
              <button
                className="btn"
                onClick={() => {
                  setShowModal(false);
                  setConfirmText('');
                }}
                disabled={resetData.isPending}
              >
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={handleConfirmReset}
                disabled={!isConfirmEnabled || resetData.isPending}
              >
                {resetData.isPending ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Deleting...
                  </>
                ) : (
                  'Delete All Data'
                )}
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => {
              if (!resetData.isPending) {
                setShowModal(false);
                setConfirmText('');
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
