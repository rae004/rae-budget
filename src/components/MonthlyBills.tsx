import { FC, useContext, useEffect } from 'react';
import TextInput, {
    TextInputProps,
} from '@/components/inputs/TextInput';
import CurrencyInput, {
    CurrencyInputProps,
} from '@/components/inputs/CurrencyInput';
import 'primereact/resources/primereact.min.css';
import SimpleButton from '@/components/buttons/SimpleButton';
import { MonthlySpendingContext } from '@/lib/globalContext';
import getTotal from '@/lib/getTotalSpending';
import useBudgetState from '@/components/hooks/UseBudgetState';
import NewDataTable, {
    NewDataTableProps,
    ColumnMeta,
} from '@/components/NewDataTable';

const MonthlyBills: FC = () => {
    const { setGlobalMonthlySpendingState } = useContext(
        MonthlySpendingContext,
    );

    const columns: ColumnMeta[] = [
        {
            field: 'text',
            header: 'Text',
        },
        {
            field: 'currency',
            header: 'Amount',
        },
    ];

    const {
        text,
        setText,
        currency,
        setCurrency,
        dataTable,
        handleAddButtonClick,
    } = useBudgetState();

    // update global state total monthly spending when dataTable changes
    useEffect(() => {
        const totalMonthlySpending = getTotal(dataTable);
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

    const tableProps: NewDataTableProps = {
        columns,
        tableData: dataTable,
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
