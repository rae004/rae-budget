import {
    Dispatch,
    FC,
    SetStateAction,
    useContext,
    useEffect,
    useState,
} from 'react';
import TextInput, {
    TextInputProps,
} from '@/components/inputs/TextInput';
import CurrencyInput, {
    CurrencyInputProps,
} from '@/components/inputs/CurrencyInput';
import 'primereact/resources/primereact.min.css';
import SimpleButton from '@/components/buttons/SimpleButton';
// import { MonthlySpendingContext } from '@/lib/hooks/globalContext';
import getTotal from '@/lib/getTotalSpending';
import useBudgetState from '@/lib/hooks/useBudgetState';
import NewDataTable, {
    NewDataTableProps,
    ColumnMeta,
} from '@/components/NewDataTable';

import { DataTableItem } from '@/components/AdditionalSpending';

const MonthlyBills = () => {
    // console.log('our monthly bills props: ', props);

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
    const [dataTable, setDataTable] = useState<any[]>([]);

    const handleAddButtonClick = () => {
        // const newItem: BudgetItem = { name, amount };
        // setDataTable([...dataTable, newItem]);
        // setMonthlySpendingItems([
        //     ...props.monthlySpendingItems,
        //     newItem,
        // ]);
        setName('');
        setAmount(0);
    };

    // update global state total monthly spending when dataTable changes
    useEffect(() => {
        const totalMonthlySpending = getTotal(dataTable);
        console.log(
            'our total monthly spending is',
            totalMonthlySpending,
        );
        // setGlobalMonthlySpendingState({
        //     totalMonthlySpending,
        // });
    }, [dataTable]);

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
