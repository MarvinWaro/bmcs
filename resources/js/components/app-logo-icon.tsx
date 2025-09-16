import { HTMLAttributes } from 'react';

export default function AppLogoIcon(props: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className="mb-6 flex items-center justify-center gap-3">
            <img src="/assets/img/unifast.png" alt="UNIFAST Logo" className="h-10 w-auto object-contain" />
        </div>
    );
}
