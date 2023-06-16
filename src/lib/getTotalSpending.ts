const getTotal = (dataTable: any) => {
    return dataTable.reduce((total: number, item: any) => {
        total += item.amount;
        return total;
    }, 0);
};

export default getTotal;
