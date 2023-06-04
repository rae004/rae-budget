const getTotal = (dataTable: any) => {
    return dataTable.reduce((total: number, item: any) => {
        total += item.currency;
        return total;
    }, 0);
};

export default getTotal;
