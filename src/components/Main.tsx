import convertNumberToCurrencyString from '@/lib/convertNumberToCurrencyString';
import MonthlyBills from '@/components/MonthlyBills';
import AdditionalSpending from '@/components/AdditionalSpending';
import TotalsOverview from '@/components/TotalsOverview';

const Main = ({ ...props }) => {
    const { additionalSpending, monthlySpending } = props;

    return (
        <main>
            <div>
                Additional Spending:{' '}
                {convertNumberToCurrencyString(
                    additionalSpending.totalAdditionalSpending,
                )}
            </div>
            <div>
                Monthly Spending:{' '}
                {convertNumberToCurrencyString(
                    monthlySpending.totalMonthlySpending,
                )}
            </div>

            <MonthlyBills />
            <AdditionalSpending />
            <TotalsOverview />
        </main>
    );
};

export default Main;
