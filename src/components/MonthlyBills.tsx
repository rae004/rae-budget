import { useContext, useState } from 'react';
import TextInput, {
    TextInputProps,
} from '@/components/inputs/TextInput';
import CurrencyInput, {
    CurrencyInputProps,
} from '@/components/inputs/CurrencyInput';
import 'primereact/resources/primereact.min.css';
import SimpleButton from '@/components/buttons/SimpleButton';
import NewDataTable, {
    NewDataTableProps,
    ColumnMeta,
} from '@/components/NewDataTable';
import {
    GlobalContext,
    SingleSpendingItemType,
} from '@/lib/hooks/globalContext';

const MonthlyBills = ({ ...props }) => {
    const { tabIndex } = props;
    const payPeriodIndex = tabIndex - 1;
    const [state, dispatch] = useContext(GlobalContext);
    const tableData =
        state.payPeriods[payPeriodIndex].payPeriodProps
            .monthlyBillsItems;

    const columns: ColumnMeta[] = [
        {
            field: 'name',
            header: 'Text',
        },
        {
            field: 'amount',
            header: 'Amount',
        },
    ];

    const [name, setName] = useState<string>('');
    const [amount, setAmount] = useState(0);

    const handleAddButtonClick = () => {
        const newItem: SingleSpendingItemType = {
            name,
            amount,
        };

        const addItemPayload = {
            tabIndex,
            newItem,
        };
        dispatch({
            type: 'ADD_MONTHLY_BILL',
            payload: addItemPayload,
        });
        setName('');
        setAmount(0);
    };

    const textProps: TextInputProps = {
        value: name,
        setText: setName,
    };
    const currencyProps: CurrencyInputProps = {
        value: amount,
        setCurrency: setAmount,
        inputClasses: '',
        currency: 'USD',
        locale: 'en-US',
    };

    const tableProps: NewDataTableProps = {
        columns,
        tableData,
        styles: {
            parentDiv: 'card',
            tableHeader: '',
            tableBody: { minWidth: '50rem' },
            columnStyle: { width: '25%' },
        },
    };

    return (
        <div>
            <h2>Monthly Bills</h2>
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

export default MonthlyBills;
