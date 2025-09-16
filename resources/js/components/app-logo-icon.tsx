import { HTMLAttributes } from 'react';

export default function AppLogoIcon(props: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className="mb-6 flex items-center justify-center gap-3">
            <img src="/assets/img/unifast.png" alt="UNIFAST Logo" className="h-14 w-auto object-contain" />
            <img src="/assets/img/ched-logo.png" alt="CHED Logo" className="h-15 w-auto object-contain" />
        </div>
    );
}
