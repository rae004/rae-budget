import { ReactNode } from 'react';
import 'primereact/resources/primereact.min.css';
import '@/app/globals.css';
import { montserrat } from '@/app/fonts';

export const metadata = {
    title: 'Rae Budget',
    description: 'Rae Budget App for tracking pay vs spending',
};

type LayoutProps = {
    children: ReactNode;
};
export default function RootLayout({
    children,
}: LayoutProps): ReactNode {
    return (
        <html lang="en">
            <body className={montserrat.className}>
                {children}
            </body>
        </html>
    );
}
