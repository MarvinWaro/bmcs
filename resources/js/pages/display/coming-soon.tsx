import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Head, Link } from '@inertiajs/react';
import { Construction, ArrowLeft, Clock } from 'lucide-react';

interface ComingSoonProps {
    title?: string;
    description?: string;
}

export default function ComingSoon({
    title = "List of Memorandum",
    description = "We're working hard to bring you this feature. Check back soon!"
}: ComingSoonProps) {
    return (
        <>
            <Head title="Coming Soon" />
            <AppHeader />

            <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center p-6">
                <Card className="w-full max-w-4xl border-2">
                    <CardContent className="pt-12 pb-12 px-8">
                        <div className="flex flex-col items-center text-center space-y-6">
                            {/* Illustration */}
                            <div className="relative w-full max-w-md">
                                <div className="rounded-2xl bg-white p-8 dark:bg-white/5 dark:backdrop-blur-sm">
                                    <img
                                        src="/assets/img/comingsoon.png"
                                        alt="Coming Soon"
                                        className="w-full h-auto dark:opacity-90"
                                    />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="space-y-3">
                                <h1 className="text-4xl font-bold tracking-tight">
                                    Coming Soon
                                </h1>
                                <h2 className="text-2xl font-semibold text-muted-foreground">
                                    {title}
                                </h2>
                                <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                                    {description}
                                </p>
                            </div>

                            {/* Status Badge */}
                            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full border border-amber-500/20">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm font-medium">In Development</span>
                            </div>

                            {/* Action Button */}
                            <div className="pt-4">
                                <Link href="/dashboard">
                                    <Button size="lg" className="gap-2">
                                        <ArrowLeft className="h-4 w-4" />
                                        Back to Dashboard
                                    </Button>
                                </Link>
                            </div>

                            {/* Additional Info */}
                            <p className="text-sm text-muted-foreground pt-4">
                                Need help? Contact your system administrator.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
