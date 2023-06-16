import { Button } from 'primereact/button';

export interface SimpleButtonProps {
    label: string;
    clickHandler: () => void;
}
const SimpleButton = ({ ...props }: SimpleButtonProps) => {
    return (
        <Button
            label={props.label}
            onClick={props.clickHandler}
        />
    );
};

export default SimpleButton;
