import { BudgetItem } from '@/lib/hooks/globalContext';

const getTotal = (dataTable: any) => {
    return dataTable.reduce(
        (total: number, item: BudgetItem) => {
            total += item.amount;
            return total;
        },
        0,
    );
};

export default getTotal;
