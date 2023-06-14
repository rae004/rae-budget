import MonthlyBills from '@/components/MonthlyBills';
import AdditionalSpending from '@/components/AdditionalSpending';
import TotalsOverview from '@/components/TotalsOverview';

const PayPeriod = ({ ...props }) => {
    return (
        <main>
            <MonthlyBills tabIndex={props.tabIndex} />
            <AdditionalSpending tabIndex={props.tabIndex} />
            <TotalsOverview tabIndex={props.tabIndex} />
        </main>
    );
};

export default PayPeriod;
