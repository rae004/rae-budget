import CurrencyInput from '@/components/inputs/CurrencyInput';
import TextInput from '@/components/inputs/TextInput';
import SimpleButton from '@/components/buttons/SimpleButton';
import NewDataTable, {
    NewDataTableProps,
} from '@/components/NewDataTable';
import usePayPeriod from '@/lib/hooks/usePayPeriod';

const AdditionalSpending = ({ ...props }) => {
    const {
        state,
        payPeriodIndex,
        columns,
        handleAddButtonClick,
        textProps,
        currencyProps,
    } = usePayPeriod({
        ...props,
        action: 'ADD_ADDITIONAL_SPENDING_ITEM',
    });

    const tableData =
        state.payPeriods[payPeriodIndex].payPeriodProps
            .additionalSpendingItems;

    const tableProps: NewDataTableProps = {
        columns,
        tableData,
        styles: {
            parentDiv: 'card',
            tableHeader: '',
            tableBody: { minWidth: '50rem' },
            columnStyle: { width: '25%' },
        },
        disableCellEditing: true,
    };

    return (
        <div>
            <h2>Additional Spending</h2>
            <div className="flex flex-wrap flex-row gap-3 p-fluid align-items-end">
                <div className="flex-auto">
                    <label
                        htmlFor="currency-us"
                        className="font-bold block mb-2"
                    >
                        Amount
                    </label>
                    <CurrencyInput {...currencyProps} />
                </div>
                <div className="flex-auto">
                    <label
                        htmlFor="text-input"
                        className="font-bold block mb-2"
                    >
                        Text
                    </label>
                    <TextInput {...textProps} />
                </div>
                <div className="flex-auto">
                    <SimpleButton
                        label={'Add'}
                        clickHandler={handleAddButtonClick}
                    />
                </div>
            </div>
            <NewDataTable {...tableProps} />
        </div>
    );
};

export default AdditionalSpending;
