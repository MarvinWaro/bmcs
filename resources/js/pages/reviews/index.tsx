import ReviewRowTemplate from '@/components/reviews/ui/reviews-row';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Search, Star, Users, TrendingUp, Calendar, Filter, X } from 'lucide-react';
import { useState, useEffect } from 'react';

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

type School = {
    id: string;
    name: string;
};

type TransactionType = {
    value: string;
    label: string;
};

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
    school_hei?: string;
    transaction_type?: string;
    date_range?: string;
    start_date?: string;
    end_date?: string;
    search?: string;
};

type PageProps = {
    reviews: ReviewRow[];
    schools: School[];
    transactionTypes: TransactionType[];
    stats: Stats;
    filters: Filters;
};

export default function ClientReviewsIndex() {
    const { props } = usePage<PageProps>();
    const { reviews, schools, transactionTypes, stats, filters } = props;

    const [localSearch, setLocalSearch] = useState(filters.search || '');

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (localSearch !== filters.search) {
                updateFilters({ search: localSearch });
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [localSearch]);

    const updateFilters = (newFilters: Partial<Filters>) => {
        const currentFilters = { ...filters };

        // Update filters
        Object.keys(newFilters).forEach(key => {
            const filterKey = key as keyof Filters;
            if (newFilters[filterKey] === '' || newFilters[filterKey] === 'all') {
                delete currentFilters[filterKey];
            } else {
                currentFilters[filterKey] = newFilters[filterKey];
            }
        });

        // Remove empty filters
        Object.keys(currentFilters).forEach(key => {
            const filterKey = key as keyof Filters;
            if (!currentFilters[filterKey]) {
                delete currentFilters[filterKey];
            }
        });

        router.get('/client-reviews', currentFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        setLocalSearch('');
        router.get('/client-reviews', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const hasActiveFilters = Object.keys(filters).some(key =>
        filters[key as keyof Filters] && key !== 'search'
    ) || localSearch;

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Client Reviews" />

            <div className="bg-background pb-6">
                <div className="space-y-6">
                    {/* Header Section */}
                    <div className="space-y-2 px-6 pt-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h5 className="text-xl font-bold tracking-tight text-foreground">Client Reviews</h5>
                                <p className="text-sm text-muted-foreground">View and manage client feedback from satisfaction surveys</p>
                            </div>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 gap-4 px-6 sm:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.filtered_total}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stats.filtered_total !== stats.total && `of ${stats.total} total`}
                                </p>
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
                                <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">{stats.filtered_dissatisfied}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stats.filtered_total > 0 ? Math.round((stats.filtered_dissatisfied / stats.filtered_total) * 100) : 0}% of filtered
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
                                <p className="text-xs text-muted-foreground">
                                    Today: {stats.today}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters Section */}
                    <div className="space-y-4 px-6">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <h6 className="text-sm font-medium">Filters</h6>
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="h-7 px-2 text-xs"
                                >
                                    <X className="h-3 w-3 mr-1" />
                                    Clear all
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                            {/* Satisfaction Rating Filter */}
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
                                        {satisfactionOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* School Filter */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">School</label>
                                <Select
                                    value={filters.school_hei || 'all'}
                                    onValueChange={(value) => updateFilters({ school_hei: value })}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Schools</SelectItem>
                                        {schools.map((school) => (
                                            <SelectItem key={school.id} value={school.name}>
                                                {school.name}
                                            </SelectItem>
                                        ))}
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Transaction Type Filter */}
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
                                        {transactionTypes.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Date Range Filter */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Date Range</label>
                                <Select
                                    value={filters.date_range || 'all'}
                                    onValueChange={(value) => updateFilters({ date_range: value })}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {dateRangeOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
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

                        {/* Active filters display */}
                        {hasActiveFilters && (
                            <div className="flex flex-wrap gap-2">
                                {filters.satisfaction_rating && (
                                    <Badge variant="secondary" className="text-xs">
                                        Satisfaction: {satisfactionOptions.find(o => o.value === filters.satisfaction_rating)?.label}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                                            onClick={() => updateFilters({ satisfaction_rating: 'all' })}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                )}
                                {filters.school_hei && (
                                    <Badge variant="secondary" className="text-xs">
                                        School: {schools.find(s => s.name === filters.school_hei)?.name || filters.school_hei}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                                            onClick={() => updateFilters({ school_hei: 'all' })}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                )}
                                {filters.transaction_type && (
                                    <Badge variant="secondary" className="text-xs">
                                        Type: {transactionTypes.find(t => t.value === filters.transaction_type)?.label}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                                            onClick={() => updateFilters({ transaction_type: 'all' })}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                )}
                                {filters.date_range && (
                                    <Badge variant="secondary" className="text-xs">
                                        Date: {dateRangeOptions.find(d => d.value === filters.date_range)?.label}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
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
                                            className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                                            onClick={() => setLocalSearch('')}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Results Summary */}
                    <div className="px-6">
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="px-3 py-1.5 text-sm font-medium">
                                {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
                                {hasActiveFilters && ` (filtered from ${stats.total})`}
                            </Badge>
                        </div>
                    </div>

                    {/* Enhanced Table Card */}
                    <Card className="rounded-none border-0 bg-card shadow-none">
                        <CardContent className="p-0">
                            <div className="overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b border-border/50 bg-muted/30 hover:bg-muted/30">
                                            <TableHead className="h-12 px-6 text-sm font-semibold text-foreground/90 w-[25%]">Client</TableHead>
                                            <TableHead className="h-12 px-6 text-sm font-semibold text-foreground/90 w-[45%]">Rating & Comment</TableHead>
                                            <TableHead className="h-12 px-6 text-sm font-semibold text-foreground/90 w-[30%]">Details</TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {reviews.map((row, index) => (
                                            <ReviewRowTemplate key={row.id} row={row} index={index} />
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Enhanced Empty states */}
                                {reviews.length === 0 && (
                                    <div className="flex flex-col items-center justify-center px-6 py-20">
                                        {hasActiveFilters ? (
                                            <>
                                                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50">
                                                    <Search className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                                <h3 className="mb-2 text-xl font-semibold text-foreground">No reviews found</h3>
                                                <p className="mb-6 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
                                                    No reviews match your current filters. Try adjusting your search criteria or clearing some filters.
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    onClick={clearFilters}
                                                    size="sm"
                                                    className="transition-all duration-200"
                                                >
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
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
