import convertNumberToCurrencyString from '@/lib/convertNumberToCurrencyString';
import { DataTableItem } from '@/components/additionalSpending';

type Props = { dataTable: DataTableItem[] };

const TwoColumnDataTableTextAndCurrency = ({
    ...props
}: Props) => {
    const { dataTable } = props;
    return (
        <table className="w-full">
            <thead>
                <tr>
                    <th className="w-1/2 text-left">Text</th>
                    <th className="w-1/2 text-left">
                        Currency
                    </th>
                </tr>
            </thead>
            <tbody>
                {dataTable.map((item, index) => (
                    <tr key={index}>
                        <td className="w-1/2">{item.text}</td>
                        <td className="w-1/2">
                            {convertNumberToCurrencyString(
                                item.currency,
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default TwoColumnDataTableTextAndCurrency;
