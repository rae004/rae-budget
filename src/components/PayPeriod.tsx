import MonthlyBills from '@/components/MonthlyBills';

const PayPeriod = ({ ...props }) => {
    return (
        <main>
            <MonthlyBills tabIndex={props.tabIndex} />
            {/*<AdditionalSpending />*/}
            {/*<TotalsOverview {...totalsOverviewProps} />*/}
        </main>
    );
};

export default PayPeriod;
