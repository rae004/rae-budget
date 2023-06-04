import {
    InputNumber,
    InputNumberValueChangeEvent,
} from 'primereact/inputnumber';
import { montserrat } from '@/app/fonts';

export interface CurrencyInputProps {
    value: number;
    setCurrency: any;
    inputClasses: string;
    currency: string;
    locale: string;
}

const CurrencyInput = ({ ...props }: CurrencyInputProps) => {
    const handleOnChange = (e: InputNumberValueChangeEvent) => {
        const value = e.target.value ?? 0;
        props.setCurrency(value);
    };

    return (
        <InputNumber
            inputId="currency-us"
            value={props.value}
            onValueChange={(e: InputNumberValueChangeEvent) =>
                handleOnChange(e)
            }
            mode="currency"
            currency={props.currency}
            locale={props.locale}
            className={montserrat.className}
        />
    );
};

export default CurrencyInput;
