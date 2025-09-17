import { Breadcrumbs } from '@/components/breadcrumbs';
import { Icon } from '@/components/icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, Menu, Moon, Sun, Monitor, Star, GraduationCap } from 'lucide-react';
import AppLogo from './app-logo';
import AppLogoIcon from './app-logo-icon';

// Admin navigation items
const adminNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Client Reviews',
        href: '/client-reviews',
        icon: Star,
    },
    {
        title: 'Schools',
        href: '/schools',
        icon: GraduationCap,
    },
];

// Staff navigation items (you can add more based on your needs)
const staffNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
];

interface AppHeaderProps {
    breadcrumbs?: BreadcrumbItem[];
}

export function AppHeader({ breadcrumbs = [] }: AppHeaderProps) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const getInitials = useInitials();
    const { appearance, updateAppearance } = useAppearance();

    // Determine user role and get appropriate navigation items
    const userRole = auth.user.role || 'admin'; // Default to admin if role not specified
    const isAdmin = userRole === 'admin';
    const isStaff = userRole === 'staff';

    // Get navigation items based on role
    const navigationItems = isAdmin ? adminNavItems : staffNavItems;

    // Get home URL based on role
    const homeUrl = dashboard(); // You can modify this based on role if needed

    // Function to cycle through themes
    const toggleTheme = () => {
        switch (appearance) {
            case 'light':
                updateAppearance('dark');
                break;
            case 'dark':
                updateAppearance('system');
                break;
            case 'system':
                updateAppearance('light');
                break;
            default:
                updateAppearance('dark');
        }
    };

    // Get current icon and tooltip text based on appearance
    const getThemeIcon = () => {
        switch (appearance) {
            case 'light':
                return { icon: Sun, tooltip: 'Switch to Dark Mode' };
            case 'dark':
                return { icon: Moon, tooltip: 'Switch to System Mode' };
            case 'system':
                return { icon: Monitor, tooltip: 'Switch to Light Mode' };
            default:
                return { icon: Sun, tooltip: 'Toggle theme' };
        }
    };

    const { icon: ThemeIcon, tooltip } = getThemeIcon();

    return (
        <>
            {/* Main Header */}
            <div className="bg-gradient-to-r from-[#222831] to-[#222831] text-white shadow-lg">
                <div className="mx-auto max-w-7xl flex h-16 items-center justify-between px-6">
                    {/* Left Section - Mobile Menu and Logo */}
                    <div className="flex items-center space-x-4">
                        {/* Mobile Menu */}
                        <div className="lg:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-[34px] w-[34px] text-white hover:bg-white/10">
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="flex h-full w-64 flex-col items-stretch justify-between bg-sidebar">
                                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                                    <SheetHeader className="flex justify-start text-left">
                                        <AppLogoIcon className="h-6 w-6 fill-current text-black dark:text-white" />
                                    </SheetHeader>
                                    <div className="flex h-full flex-1 flex-col space-y-4 p-4">
                                        <div className="flex h-full flex-col justify-between text-sm">
                                            <div className="flex flex-col space-y-4">
                                                {navigationItems.map((item) => (
                                                    <Link key={item.title} href={item.href} className="flex items-center space-x-2 font-medium">
                                                        {item.icon && <Icon iconNode={item.icon} className="h-5 w-5" />}
                                                        <span>{item.title}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>

                        {/* Logo and Title */}
                        <Link href={homeUrl} prefetch className="flex items-center space-x-3">
                            <img src="/assets/img/unifast.png" alt="UNIFAST Logo" className="h-10 w-auto object-contain" />
                            <div className="text-lg font-semibold text-white">
                                UniFAST BARMM Admin
                            </div>
                        </Link>
                    </div>

                    {/* Right Section - Controls */}
                    <div className="flex items-center space-x-3">
                        {/* Theme Toggle */}
                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-white hover:bg-white/10 transition-colors"
                                        onClick={toggleTheme}
                                    >
                                        <ThemeIcon className="h-4 w-4" />
                                        <span className="sr-only">Toggle theme</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{tooltip}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {/* User Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-10 w-10 rounded-full p-1 hover:bg-white/10">
                                    <Avatar className="h-8 w-8 overflow-hidden rounded-full border-2 border-white/20">
                                        <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                        <AvatarFallback className="bg-white/10 text-white font-semibold text-sm">
                                            {getInitials(auth.user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end">
                                <UserMenuContent user={auth.user} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Navigation Bar */}
            <div className="border-b border-border/50 bg-background">
                <div className="mx-auto max-w-7xl flex h-12 items-center px-6">
                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex h-full items-center">
                        <NavigationMenu className="flex h-full items-stretch">
                            <NavigationMenuList className="flex h-full items-stretch space-x-0">
                                {navigationItems.map((item, index) => (
                                    <NavigationMenuItem key={index} className="relative flex h-full items-center">
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                "flex items-center h-full px-4 text-sm font-medium transition-colors hover:text-primary border-b-2 border-transparent",
                                                page.url === (typeof item.href === 'string' ? item.href : item.href.url)
                                                    ? "text-primary border-primary bg-primary/5"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            {item.icon && <Icon iconNode={item.icon} className="mr-2 h-4 w-4" />}
                                            {item.title}
                                        </Link>
                                    </NavigationMenuItem>
                                ))}
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>

                    {/* Breadcrumbs for mobile */}
                    <div className="lg:hidden flex-1">
                        {breadcrumbs.length > 1 && <Breadcrumbs breadcrumbs={breadcrumbs} />}
                    </div>
                </div>
            </div>

            {/* Breadcrumbs for desktop */}
            {breadcrumbs.length > 1 && (
                <div className="hidden lg:flex w-full border-b border-border/30 bg-muted/20">
                    <div className="mx-auto max-w-7xl flex h-10 w-full items-center justify-start px-6">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>
            )}
        </>
    );
}
