const convertNumberToCurrencyString = (
    number: number,
): string => {
    // round to the nearest hundredth
    const convertedNumber = Math.round(number * 100) / 100;

    // check if number has decimal
    const noChange = number % 1 === 0;

    return noChange
        ? `$${convertedNumber}.00`
        : `$${convertedNumber}`;
};

export default convertNumberToCurrencyString;
