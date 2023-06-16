import { Montserrat } from 'next/font/google';

export const montserrat = Montserrat({
    subsets: ['latin'],
    display: 'swap',
    weight: [
        '200',
        '300',
        '400',
        '500',
        '600',
        '700',
        '800',
        '900',
    ],
    fallback: ['Helvetica', 'Arial', 'sans-serif'],
});
