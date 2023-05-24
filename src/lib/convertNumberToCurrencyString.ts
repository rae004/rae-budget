const countDecimals = (number: number): number => {
    return number.toString().split('.')[1]?.length || 0;
};

const convertNumberToCurrencyString = (
    number: number,
): string => {
    // round to the nearest hundredth
    const convertedNumber = Math.round(number * 100) / 100;

    // check if number has decimal
    if (number % 1 === 0) {
        return `$${convertedNumber}.00`;
    }

    // check if number has one decimal and add trialing zero
    if (countDecimals(convertedNumber) === 1) {
        return `$${convertedNumber}0`;
    }

    return `$${convertedNumber}`;
};

export default convertNumberToCurrencyString;
