import Image from 'next/image';
import AdditionalSpending from '@/components/additionalSpending';

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
            <h1>Hello World</h1>
            <div className={'w-1/2'}>
                <AdditionalSpending />
            </div>
        </main>
    );
}
