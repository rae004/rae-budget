import TwoColumnDataTableTextAndCurrency from '@/components/twoColumnDataTableTextAndCurrency';
import { useContext, useEffect, useState } from 'react';
import { DataTableItem } from '@/components/additionalSpending';
import TextInput, {
    TextInputProps,
} from '@/components/inputs/TextInput';
import CurrencyInput, {
    CurrencyInputProps,
} from '@/components/inputs/CurrencyInput';
import 'primereact/resources/primereact.min.css';
import SimpleButton from '@/components/buttons/SimpleButton';
import {
    AdditionalSpendingContext,
    GlobalMonthlySpendingState,
    MonthlySpendingContext,
} from '@/lib/globalContext';

const MonthlyBills = () => {
    const { setGlobalMonthlySpendingState } = useContext(
        MonthlySpendingContext,
    );
    const [text, setText] = useState<string>('');
    const [currency, setCurrency] = useState(0);
    const [dataTable, setDataTable] = useState<DataTableItem[]>(
        [],
    );

    const getTotalMonthlyBillsSpending = () => {
        return dataTable.reduce((total, item) => {
            total += item.currency;
            return total;
        }, 0);
    };

    const handleAddButtonClick = () => {
        const newItem: DataTableItem = { text, currency };
        setDataTable([...dataTable, newItem]);
        setText('');
        setCurrency(0);
    };

    // update global state total monthly spending when dataTable changes
    useEffect(() => {
        const totalMonthlySpending =
            getTotalMonthlyBillsSpending();
        setGlobalMonthlySpendingState({
            totalMonthlySpending,
        });
    }, [dataTable]);

    const textProps: TextInputProps = {
        value: text,
        setText,
    };
    const currencyProps: CurrencyInputProps = {
        value: currency,
        setCurrency,
        inputClasses: '',
        currency: 'USD',
        locale: 'en-US',
    };

    return (
        <div>
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

            {/*<TwoColumnDataTableTextAndCurrency*/}
            {/*    dataTable={dataTable}*/}
            {/*/>*/}
        </div>
    );
};

export default MonthlyBills;
