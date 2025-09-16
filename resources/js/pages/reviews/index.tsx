import ReviewRowTemplate from '@/components/reviews/ui/reviews-row';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Search, Star } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Client Reviews', href: '/client-reviews' }];

export type ReviewRow = {
    id: string;
    clientName: string;
    email: string;
    rating: number;
    comment: string;
    date: string;
    status: string;
    loanType: string;
    schoolHei: string;
    satisfactionRating: string;
    transactionType: string;
    submittedAt: string;
};

type PageProps = { reviews: ReviewRow[] };

export default function ClientReviewsIndex() {
    const { props } = usePage<PageProps>();
    const rows = props.reviews ?? [];

    const [searchQuery, setSearchQuery] = useState('');
    const filteredRows = rows.filter((row) =>
        row.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.schoolHei.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Client Reviews" />

            <div className="bg-background pb-6">
                <div className="space-y-4">
                    {/* Header Section */}
                    <div className="space-y-2 px-6 pt-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h5 className="text-xl font-bold tracking-tight text-foreground">Client Reviews</h5>
                                <p className="text-sm text-muted-foreground">View and manage client feedback from satisfaction surveys</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats and Search Section */}
                    <div className="flex flex-col gap-4 px-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium">
                                {rows.length} {rows.length === 1 ? 'Review' : 'Reviews'}
                            </Badge>
                            {searchQuery && (
                                <Badge variant="outline" className="px-3 py-1.5 text-sm">
                                    {filteredRows.length} filtered
                                </Badge>
                            )}
                        </div>

                        {/* Search */}
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search reviews..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 transition-all duration-200"
                            />
                        </div>
                    </div>

                    {/* Enhanced Table Card */}
                    <Card className="rounded-none border-0 bg-card shadow-none">
                        <CardContent className="p-0">
                            <div className="overflow-hidden">
                                <Table>
                                    <TableHeader>
                                         <TableRow className="border-bborder-border/50 bg-muted/30 hover:bg-muted/30">
                                            <TableHead className="h-12 px-6 text-sm font-semibold text-foreground/90 w-[25%]">Client</TableHead>
                                            <TableHead className="h-12 px-6 text-sm font-semibold text-foreground/90 w-[45%]">Rating & Comment</TableHead>
                                            <TableHead className="h-12 px-6 text-sm font-semibold text-foreground/90 w-[30%]">Details</TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {filteredRows.map((row, index) => (
                                            <ReviewRowTemplate key={row.id} row={row} index={index} />
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Enhanced Empty states */}
                                {filteredRows.length === 0 && (
                                    <div className="flex flex-col items-center justify-center px-6 py-20">
                                        {searchQuery ? (
                                            <>
                                                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50">
                                                    <Search className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                                <h3 className="mb-2 text-xl font-semibold text-foreground">No reviews found</h3>
                                                <p className="mb-6 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
                                                    No reviews match your search for "{searchQuery}". Try adjusting your search terms or check the
                                                    spelling.
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setSearchQuery('')}
                                                    size="sm"
                                                    className="transition-all duration-200"
                                                >
                                                    Clear search
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                                                    <Star className="h-8 w-8 text-primary" />
                                                </div>
                                                <h3 className="mb-2 text-xl font-semibold text-foreground">No reviews yet</h3>
                                                <p className="mb-8 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
                                                    Client satisfaction survey responses will appear here once submitted.
                                                </p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
