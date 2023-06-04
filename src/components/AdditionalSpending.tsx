import { FC, useContext, useEffect } from 'react';
import { AdditionalSpendingContext } from '@/lib/globalContext';
import CurrencyInput, {
    CurrencyInputProps,
} from '@/components/inputs/CurrencyInput';
import TextInput, {
    TextInputProps,
} from '@/components/inputs/TextInput';
import SimpleButton from '@/components/buttons/SimpleButton';
import RaeDataTable, {
    ColumnMeta,
    RaeDataTableProps,
} from '@/components/DataTable';
import getTotal from '@/lib/getTotalSpending';
import useBudgetState from '@/components/hooks/UseBudgetState';

export interface DataTableItem {
    text: string;
    currency: number;
}

const AdditionalSpending: FC = () => {
    const { setGlobalAdditionalSpendingState } = useContext(
        AdditionalSpendingContext,
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

    // update global state total additional spending when dataTable changes
    useEffect(() => {
        const totalAdditionalSpending = getTotal(dataTable);
        setGlobalAdditionalSpendingState({
            totalAdditionalSpending,
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

    const dataTableProps: RaeDataTableProps = {
        dataTable,
        columns,
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
            <RaeDataTable {...dataTableProps} />
        </div>
    );
};

export default AdditionalSpending;
