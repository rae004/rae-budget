'use client';
import { FC, useState } from 'react';
import convertNumberToCurrencyString from '@/lib/convertNumberToCurrencyString';

interface DataTableItem {
    text: string;
    currency: number;
}

const AdditionalSpending: FC = () => {
    const [text, setText] = useState('');
    const [currency, setCurrency] = useState(0);
    const [dataTable, setDataTable] = useState<DataTableItem[]>([]);

    const handleAddButtonClick = () => {
        const newItem: DataTableItem = { text, currency };
        setDataTable([...dataTable, newItem]);
        setText('');
        setCurrency(0);
    };

    return (
        <div className="container mx-auto">
            <div className="w-full flex justify-center items-center mb-4">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="mr-2 p-2 border text-white dark:text-black"
                />
                <input
                    type="number"
                    value={currency}
                    onChange={(e) => setCurrency(parseFloat(e.target.value))}
                    className="mr-2 p-2 border text-white dark:text-black"
                />
                <button
                    onClick={handleAddButtonClick}
                    className="p-2 bg-blue-500 text-white"
                >
                    Add
                </button>
            </div>
            <table className="w-full">
                <thead>
                    <tr>
                        <th className="w-1/2 text-left">Text</th>
                        <th className="w-1/2 text-left">Currency</th>
                    </tr>
                </thead>
                <tbody>
                    {dataTable.map((item, index) => (
                        <tr key={index}>
                            <td className="w-1/2">{item.text}</td>
                            <td className="w-1/2">
                                {convertNumberToCurrencyString(item.currency)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdditionalSpending;
