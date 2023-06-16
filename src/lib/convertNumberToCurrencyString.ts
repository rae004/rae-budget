interface ConvertNumberToCurrencyStringProps {
    number: number;
    locale: string;
    formatOptions?: Intl.NumberFormatOptions;
}

const convertNumberToCurrencyString = ({
    number,
    locale,
    formatOptions,
}: ConvertNumberToCurrencyStringProps): string => {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'USD',
        ...formatOptions,
    }).format(number);
};

export default convertNumberToCurrencyString;
