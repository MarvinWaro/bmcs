// resources/js/pages/reviews/index.tsx
import ReviewRowTemplate from '@/components/reviews/ui/reviews-row';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Calendar, Filter, Search, Star, TrendingUp, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';

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

type School = { id: number; name: string };
type TransactionType = { value: string; label: string };

type Stats = {
    total: number;
    satisfied: number;
    dissatisfied: number;
    filtered_total: number;
    filtered_satisfied: number;
    filtered_dissatisfied: number;
    today: number;
    this_month: number;
};

type Filters = {
    satisfaction_rating?: string;
    school_id?: string; // <-- use school_id (id or "other")
    transaction_type?: string;
    date_range?: string;
    start_date?: string;
    end_date?: string;
    search?: string;
    per_page?: number;
    page?: number;
};

type PaginationMeta = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
};

type PaginatedReviews = { data: ReviewRow[] } & PaginationMeta;

type PageProps = {
    reviews: PaginatedReviews;
    schools: School[];
    transactionTypes: TransactionType[];
    stats: Stats;
    filters: Filters;
};

function PaginationComponent({ meta, onPageChange }: { meta: PaginationMeta; onPageChange: (page: number) => void }) {
    const { current_page, last_page, from, to, total } = meta;

    const getVisiblePages = () => {
        const delta = 2;
        const range: (number | string)[] = [];
        const rangeWithDots: (number | string)[] = [];

        for (let i = Math.max(2, current_page - delta); i <= Math.min(last_page - 1, current_page + delta); i++) {
            range.push(i);
        }
        if (current_page - delta > 2) rangeWithDots.push(1, '...');
        else rangeWithDots.push(1);
        rangeWithDots.push(...range);
        if (current_page + delta < last_page - 1) rangeWithDots.push('...', last_page);
        else if (last_page > 1) rangeWithDots.push(last_page);

        return rangeWithDots;
    };

    if (last_page <= 1) return null;
    const visiblePages = getVisiblePages();

    return (
        <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                    Showing {from} to {to} of {total} results
                </span>
            </div>
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            href="#"
                            size="default"
                            onClick={(e) => {
                                e.preventDefault();
                                if (current_page > 1) onPageChange(current_page - 1);
                            }}
                            className={current_page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                    </PaginationItem>

                    {visiblePages.map((page, i) => (
                        <PaginationItem key={i}>
                            {page === '...' ? (
                                <PaginationEllipsis />
                            ) : (
                                <PaginationLink
                                    href="#"
                                    size="default"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onPageChange(page as number);
                                    }}
                                    isActive={page === current_page}
                                    className="cursor-pointer"
                                >
                                    {page}
                                </PaginationLink>
                            )}
                        </PaginationItem>
                    ))}

                    <PaginationItem>
                        <PaginationNext
                            href="#"
                            size="default"
                            onClick={(e) => {
                                e.preventDefault();
                                if (current_page < last_page) onPageChange(current_page + 1);
                            }}
                            className={current_page === last_page ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    );
}

export default function ClientReviewsIndex() {
    const { props } = usePage<PageProps>();
    const { reviews, schools, transactionTypes, stats, filters } = props;

    const [localSearch, setLocalSearch] = useState(filters.search || '');

    const isEmptyFilterValue = (v: unknown): v is '' | 'all' | undefined => v === '' || v === 'all' || v === undefined;

    useEffect(() => {
        const t = setTimeout(() => {
            if (localSearch !== filters.search) updateFilters({ search: localSearch });
        }, 300);
        return () => clearTimeout(t);
    }, [localSearch]);

    function setFilter<K extends keyof Filters>(obj: Filters, key: K, value: Filters[K] | '' | 'all' | undefined) {
        if (isEmptyFilterValue(value)) delete obj[key];
        else obj[key] = value as Filters[K];
    }

    const updateFilters = (newFilters: Partial<Filters>) => {
        const current: Filters = { ...filters };
        (Object.keys(newFilters) as (keyof Filters)[]).forEach((key) => {
            setFilter(current, key, newFilters[key]);
        });
        (Object.keys(current) as (keyof Filters)[]).forEach((key) => {
            const v = current[key];
            if (isEmptyFilterValue(v)) delete current[key];
        });
        if (!('per_page' in newFilters)) delete current.page;

        router.get('/client-reviews', current, { preserveState: true, preserveScroll: true });
    };

    const handlePageChange = (page: number) => {
        router.get('/client-reviews', { ...filters, page }, { preserveState: true, preserveScroll: true });
    };

    const clearFilters = () => {
        setLocalSearch('');
        router.get('/client-reviews', { per_page: filters.per_page || 10 }, { preserveState: true, preserveScroll: true });
    };

    const hasActiveFilters =
        Object.keys(filters).some((k) => {
            const key = k as keyof Filters;
            const v = filters[key];
            return v !== undefined && v !== '' && key !== 'search' && key !== 'per_page' && key !== 'page';
        }) || Boolean(localSearch);

    const satisfactionOptions = [
        { value: 'all', label: 'All Ratings' },
        { value: 'satisfied', label: 'Satisfied' },
        { value: 'dissatisfied', label: 'Dissatisfied' },
    ];

    const dateRangeOptions = [
        { value: 'all', label: 'All Time' },
        { value: 'today', label: 'Today' },
        { value: 'this_week', label: 'This Week' },
        { value: 'this_month', label: 'This Month' },
        { value: 'this_year', label: 'This Year' },
        { value: 'last_30_days', label: 'Last 30 Days' },
    ];

    const perPageOptions = [
        { value: 5, label: '5 per page' },
        { value: 10, label: '10 per page' },
        { value: 15, label: '15 per page' },
        { value: 20, label: '20 per page' },
        { value: 25, label: '25 per page' },
        { value: 50, label: '50 per page' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Client Reviews" />
            <div className="bg-background pb-6">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="space-y-2 px-6 pt-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h5 className="text-xl font-bold tracking-tight text-foreground">Client Reviews</h5>
                                <p className="text-sm text-muted-foreground">View and manage client feedback from satisfaction surveys</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 gap-4 px-6 sm:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.filtered_total}</div>
                                <p className="text-xs text-muted-foreground">{stats.filtered_total !== stats.total && `of ${stats.total} total`}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Satisfied</CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{stats.filtered_satisfied}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stats.filtered_total > 0 ? Math.round((stats.filtered_satisfied / stats.filtered_total) * 100) : 0}% of filtered
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Dissatisfied</CardTitle>
                                <TrendingUp className="h-4 w-4 rotate-180 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">{stats.filtered_dissatisfied}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stats.filtered_total > 0 ? Math.round((stats.filtered_dissatisfied / stats.filtered_total) * 100) : 0}% of
                                    filtered
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.this_month}</div>
                                <p className="text-xs text-muted-foreground">Today: {stats.today}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters */}
                    <div className="space-y-4 px-6">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <h6 className="text-sm font-medium">Filters</h6>
                            {hasActiveFilters && (
                                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2 text-xs">
                                    <X className="mr-1 h-3 w-3" /> Clear all
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                            {/* Satisfaction */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Satisfaction</label>
                                <Select
                                    value={filters.satisfaction_rating || 'all'}
                                    onValueChange={(value) => updateFilters({ satisfaction_rating: value })}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {satisfactionOptions.map((o) => (
                                            <SelectItem key={o.value} value={o.value}>
                                                {o.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* School */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">School</label>
                                <Select value={filters.school_id || 'all'} onValueChange={(value) => updateFilters({ school_id: value })}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Schools</SelectItem>
                                        {schools.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                        <SelectItem value="other">Other (Not Listed)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Transaction Type */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Transaction Type</label>
                                <Select
                                    value={filters.transaction_type || 'all'}
                                    onValueChange={(value) => updateFilters({ transaction_type: value })}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        {transactionTypes.map((t) => (
                                            <SelectItem key={t.value} value={t.value}>
                                                {t.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Date Range */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Date Range</label>
                                <Select value={filters.date_range || 'all'} onValueChange={(value) => updateFilters({ date_range: value })}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {dateRangeOptions.map((d) => (
                                            <SelectItem key={d.value} value={d.value}>
                                                {d.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Per Page */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Per Page</label>
                                <Select value={String(filters.per_page || 10)} onValueChange={(v) => updateFilters({ per_page: Number(v) })}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[5, 10, 15, 20, 25, 50].map((n) => (
                                            <SelectItem key={n} value={String(n)}>
                                                {n} per page
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Search */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Search</label>
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search reviews..."
                                        value={localSearch}
                                        onChange={(e) => setLocalSearch(e.target.value)}
                                        className="h-9 pl-9"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Active filters */}
                        {hasActiveFilters && (
                            <div className="flex flex-wrap gap-2">
                                {filters.satisfaction_rating && (
                                    <Badge variant="secondary" className="text-xs">
                                        Satisfaction: {satisfactionOptions.find((o) => o.value === filters.satisfaction_rating)?.label}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                                            onClick={() => updateFilters({ satisfaction_rating: 'all' })}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                )}

                                {filters.school_id && (
                                    <Badge variant="secondary" className="text-xs">
                                        School:{' '}
                                        {filters.school_id === 'other'
                                            ? 'Other (Not Listed)'
                                            : (schools.find((s) => String(s.id) === String(filters.school_id))?.name ?? filters.school_id)}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                                            onClick={() => updateFilters({ school_id: 'all' })}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                )}

                                {filters.transaction_type && (
                                    <Badge variant="secondary" className="text-xs">
                                        Type: {transactionTypes.find((t) => t.value === filters.transaction_type)?.label}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                                            onClick={() => updateFilters({ transaction_type: 'all' })}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                )}

                                {filters.date_range && (
                                    <Badge variant="secondary" className="text-xs">
                                        Date: {dateRangeOptions.find((d) => d.value === filters.date_range)?.label}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                                            onClick={() => updateFilters({ date_range: 'all' })}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                )}

                                {localSearch && (
                                    <Badge variant="secondary" className="text-xs">
                                        Search: "{localSearch}"
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                                            onClick={() => setLocalSearch('')}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Results summary */}
                    <div className="px-6">
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="px-3 py-1.5 text-sm font-medium">
                                {reviews.data.length} {reviews.data.length === 1 ? 'Review' : 'Reviews'}
                                {hasActiveFilters && ` (filtered from ${stats.total})`}
                            </Badge>
                            {reviews.total > 0 && (
                                <span className="text-sm text-muted-foreground">
                                    Page {reviews.current_page} of {reviews.last_page}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <Card className="rounded-none border-0 bg-card shadow-none">
                        <CardContent className="p-0">
                            <div className="overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b border-border/50 bg-muted/30 hover:bg-muted/30">
                                            <TableHead className="h-12 w-[25%] px-6 text-sm font-semibold text-foreground/90">Client</TableHead>
                                            <TableHead className="h-12 w-[45%] px-6 text-sm font-semibold text-foreground/90">
                                                Rating & Comment
                                            </TableHead>
                                            <TableHead className="h-12 w-[30%] px-6 text-sm font-semibold text-foreground/90">Details</TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {reviews.data.map((row, index) => (
                                            <ReviewRowTemplate key={row.id} row={row} index={index} />
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Empty states */}
                                {reviews.data.length === 0 && (
                                    <div className="flex flex-col items-center justify-center px-6 py-20">
                                        {hasActiveFilters ? (
                                            <>
                                                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50">
                                                    <Search className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                                <h3 className="mb-2 text-xl font-semibold text-foreground">No reviews found</h3>
                                                <p className="mb-6 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
                                                    No reviews match your current filters. Try adjusting your search criteria or clearing some
                                                    filters.
                                                </p>
                                                <Button variant="outline" onClick={clearFilters} size="sm" className="transition-all duration-200">
                                                    Clear all filters
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

                                {/* Pagination */}
                                {reviews.data.length > 0 && <PaginationComponent meta={reviews} onPageChange={handlePageChange} />}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
