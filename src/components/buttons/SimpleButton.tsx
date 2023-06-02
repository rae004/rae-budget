import { Button } from 'primereact/button';

export interface SimpleButtonProps {
    label: string;
}
const SimpleButton = ({ ...props }: SimpleButtonProps) => {
    return <Button label={props.label} />;
};

export default SimpleButton;
