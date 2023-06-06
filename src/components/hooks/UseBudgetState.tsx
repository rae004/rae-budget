import { useState } from 'react';
import { DataTableItem } from '@/components/AdditionalSpending';

const useBudgetState = () => {
    const [text, setText] = useState<string>('');
    const [currency, setCurrency] = useState(0);
    const [dataTable, setDataTable] = useState<DataTableItem[]>(
        [{ text: '', currency: 0 }],
    );

    const handleAddButtonClick = () => {
        const newItem: DataTableItem = { text, currency };
        setDataTable([...dataTable, newItem]);
        setText('');
        setCurrency(0);
    };

    return {
        text,
        currency,
        dataTable,
        handleAddButtonClick,
        setText,
        setCurrency,
    };
};

export default useBudgetState;
