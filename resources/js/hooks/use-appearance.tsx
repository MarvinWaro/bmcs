import { useCallback, useEffect, useState } from 'react';

export type Appearance = 'light' | 'dark' | 'system';

/** True if OS theme is dark */
const prefersDark = () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

/** Write a simple cookie (for SSR if you need it) */
const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') return;
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

/** Apply the theme to <html> (Tailwind/shadcn expects the 'dark' class) */
const applyTheme = (appearance: Appearance) => {
    const isDark = appearance === 'dark' || (appearance === 'system' && prefersDark());
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
};

const mediaQuery = () => (typeof window === 'undefined' ? null : window.matchMedia('(prefers-color-scheme: dark)'));

const handleSystemThemeChange = () => {
    const currentAppearance = (localStorage.getItem('appearance') as Appearance) || 'light';
    applyTheme(currentAppearance);
};

/** Call this once before React renders to avoid FOUC/flash */
export function initializeTheme() {
    const savedAppearance = (localStorage.getItem('appearance') as Appearance) || 'light';
    applyTheme(savedAppearance);
    mediaQuery()?.addEventListener('change', handleSystemThemeChange);
}

export function useAppearance() {
    // DEFAULT TO LIGHT
    const [appearance, setAppearance] = useState<Appearance>('light');

    const updateAppearance = useCallback((mode: Appearance) => {
        setAppearance(mode);
        localStorage.setItem('appearance', mode); // client persistence
        setCookie('appearance', mode); // optional SSR hint
        applyTheme(mode);
    }, []);

    useEffect(() => {
        const savedAppearance = (localStorage.getItem('appearance') as Appearance) || 'light';
        updateAppearance(savedAppearance);

        return () => mediaQuery()?.removeEventListener('change', handleSystemThemeChange);
    }, [updateAppearance]);

    return { appearance, updateAppearance } as const;
}
