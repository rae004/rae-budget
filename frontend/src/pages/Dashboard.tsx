import { useState, useEffect } from 'react';
import { usePayPeriods, usePayPeriod } from '../hooks/usePayPeriods';
import { useBills } from '../hooks/useBills';
import { useSpending } from '../hooks/useSpending';
import { PayPeriodSelector } from '../components/PayPeriodSelector';
import { PayPeriodForm } from '../components/PayPeriodForm';
import { SummaryCard } from '../components/SummaryCard';
import { BillsTable } from '../components/BillsTable';
import { AddBillForm } from '../components/AddBillForm';
import { SpendingTable } from '../components/SpendingTable';
import { AddSpendingForm } from '../components/AddSpendingForm';

export function Dashboard() {
  const [selectedPayPeriodId, setSelectedPayPeriodId] = useState<number | undefined>();

  const { data: payPeriods, isLoading: isLoadingPayPeriods } = usePayPeriods();
  const { data: payPeriodDetail, isLoading: isLoadingDetail } = usePayPeriod(selectedPayPeriodId);
  const { data: bills, isLoading: isLoadingBills } = useBills(selectedPayPeriodId);
  const { data: spending, isLoading: isLoadingSpending } = useSpending(selectedPayPeriodId);

  // Select the most recent pay period by default
  useEffect(() => {
    if (payPeriods && payPeriods.length > 0 && !selectedPayPeriodId) {
      setSelectedPayPeriodId(payPeriods[0].id);
    }
  }, [payPeriods, selectedPayPeriodId]);

  if (isLoadingPayPeriods) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Pay Period Selector */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        {payPeriods && payPeriods.length > 0 ? (
          <PayPeriodSelector
            payPeriods={payPeriods}
            selectedId={selectedPayPeriodId}
            onSelect={setSelectedPayPeriodId}
          />
        ) : (
          <div className="text-lg">Welcome! Create your first pay period to get started.</div>
        )}
        <PayPeriodForm
          onSuccess={() => {
            // Will auto-select via the useEffect
          }}
        />
      </div>

      {/* Pay Period Detail */}
      {selectedPayPeriodId && (
        <>
          {isLoadingDetail ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner"></span>
            </div>
          ) : payPeriodDetail ? (
            <SummaryCard payPeriod={payPeriodDetail} />
          ) : null}

          {/* Bills Section */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Bills</h2>
              {isLoadingBills ? (
                <div className="flex justify-center py-4">
                  <span className="loading loading-spinner"></span>
                </div>
              ) : (
                <>
                  <BillsTable bills={bills ?? []} payPeriodId={selectedPayPeriodId} />
                  <div className="divider"></div>
                  <AddBillForm payPeriodId={selectedPayPeriodId} />
                </>
              )}
            </div>
          </div>

          {/* Spending Section */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Additional Spending</h2>
              {isLoadingSpending ? (
                <div className="flex justify-center py-4">
                  <span className="loading loading-spinner"></span>
                </div>
              ) : (
                <>
                  <SpendingTable entries={spending ?? []} payPeriodId={selectedPayPeriodId} />
                  <div className="divider"></div>
                  <AddSpendingForm payPeriodId={selectedPayPeriodId} />
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
