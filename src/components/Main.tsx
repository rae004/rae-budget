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
                {convertNumberToCurrencyString({
                    number: additionalSpending.totalAdditionalSpending,
                    locale: 'en-US',
                })}
            </div>
            <div>
                Monthly Spending:{' '}
                {convertNumberToCurrencyString({
                    number: monthlySpending.totalMonthlySpending,
                    locale: 'en-US',
                })}
            </div>

            <MonthlyBills />
            <AdditionalSpending />
            <TotalsOverview />
        </main>
    );
};

export default Main;
