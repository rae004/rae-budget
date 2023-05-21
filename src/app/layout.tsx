import { ReactNode } from 'react';
import '@/app/globals.css';
import { montserrat } from '@/app/fonts';

export const metadata = {
    title: 'Rae Budget',
    description: 'Rae Budget App for tracking pay vs spending',
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body className={montserrat.className}>{children}</body>
        </html>
    );
}
