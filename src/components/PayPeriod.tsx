import MonthlyBills from '@/components/MonthlyBills';
import AdditionalSpending from '@/components/AdditionalSpending';

const PayPeriod = ({ ...props }) => {
    return (
        <main>
            <MonthlyBills tabIndex={props.tabIndex} />
            <AdditionalSpending tabIndex={props.tabIndex} />
            {/*<TotalsOverview {...totalsOverviewProps} />*/}
        </main>
    );
};

export default PayPeriod;
