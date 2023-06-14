import { useContext, useState } from 'react';
import {
    GlobalContext,
    SingleSpendingItemType,
} from '@/lib/hooks/globalContext';
import { ColumnMeta } from '@/components/NewDataTable';
import { TextInputProps } from '@/components/inputs/TextInput';
import { CurrencyInputProps } from '@/components/inputs/CurrencyInput';

const usePayPeriod = ({ ...props }) => {
    const { tabIndex, action } = props;
    const payPeriodIndex = tabIndex - 1;
    const [state, dispatch] = useContext(GlobalContext);

    // console.log('our table data: ', tableData);

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
            type: action,
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

    return {
        state,
        payPeriodIndex,
        columns,
        handleAddButtonClick,
        textProps,
        currencyProps,
    };
};

export default usePayPeriod;
