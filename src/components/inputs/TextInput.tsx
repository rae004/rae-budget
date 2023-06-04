import { InputText } from 'primereact/inputtext';
import { ChangeEvent } from 'react';

export interface TextInputProps {
    value: string;
    setText: any;
}

const TextInput = ({ ...props }: TextInputProps) => {
    const handleOnChange = (
        e: ChangeEvent<HTMLInputElement>,
    ) => {
        const value = e.target.value ? e.target.value : '';
        props.setText(value);
    };

    return (
        <InputText
            value={props.value}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleOnChange(e)
            }
        />
    );
};

export default TextInput;
