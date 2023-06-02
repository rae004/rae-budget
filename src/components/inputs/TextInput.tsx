import { InputText } from 'primereact/inputtext';
import React from 'react';
import { InputNumberValueChangeEvent } from 'primereact/inputnumber';

export interface TextInputProps {
    value: string;
    setText: (value: string) => void;
}

const TextInput = ({ ...props }: TextInputProps) => {
    const handleOnChange = (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const value = e.target.value ? e.target.value : '';
        props.setText(value);
    };

    return (
        <InputText
            value={props.value}
            onChange={(
                e: React.ChangeEvent<HTMLInputElement>,
            ) => handleOnChange(e)}
        />
    );
};

export default TextInput;
