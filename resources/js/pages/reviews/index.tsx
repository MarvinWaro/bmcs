import ReviewRowTemplate from '@/components/reviews/ui/reviews-row';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Plus, Search, Star } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';

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
        row.comment.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // -------------------------
    // Create modal + form
    // -------------------------
    const [openCreate, setOpenCreate] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        clientName: '',
        email: '',
        rating: '',
        comment: '',
        loanType: '',
        status: 'pending'
    });

    function handleCreateSubmit(e: FormEvent) {
        e.preventDefault();

        const promise = new Promise<void>((resolve, reject) => {
            // Create a proper transaction type mapping
            const transactionTypeMapping: { [key: string]: string } = {
                'Educational Loan': 'enrollment',
                'Student Loan': 'enrollment',
                'Personal Loan': 'payment',
                'Transcript Request': 'transcript',
                'Certification': 'certification',
                'Scholarship Application': 'scholarship',
                'Consultation': 'consultation'
            };

            const transactionType = transactionTypeMapping[data.loanType] || 'other';

            // Convert rating to satisfaction rating
            let satisfactionRating = 'neutral';
            const ratingNum = parseInt(data.rating);
            if (ratingNum >= 4) satisfactionRating = 'satisfied';
            else if (ratingNum <= 2) satisfactionRating = 'dissatisfied';

            post('/client-satisfaction-survey', {
                transaction_date: new Date().toISOString().split('T')[0],
                client_name: data.clientName,
                email: data.email || null,
                school_hei: 'Admin Created Entry',
                transaction_type: transactionType,
                satisfaction_rating: satisfactionRating,
                reason: data.comment
            }, {
                preserveScroll: true,
                onSuccess: () => resolve(),
                onError: () => reject('Failed to create review. Please try again.'),
            });
        });

        toast.promise(promise, {
            loading: 'Creating review...',
            success: 'Review created successfully!',
            error: (message) => message,
            duration: 2000,
        });

        promise.finally(() => {
            reset();
            setOpenCreate(false);
        });
    }

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
                                <p className="text-sm text-muted-foreground">Manage client feedback and reviews</p>
                            </div>

                            {/* Create modal trigger */}
                            <Dialog
                                open={openCreate}
                                onOpenChange={(v) => {
                                    setOpenCreate(v);
                                }}
                            >
                                <DialogTrigger asChild>
                                    <Button size="default" className="shadow-sm">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Review
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                                <Star className="h-4 w-4 text-primary" />
                                            </div>
                                            Add New Review
                                        </DialogTitle>
                                        <DialogDescription>Add a new client review to track feedback and satisfaction.</DialogDescription>
                                    </DialogHeader>

                                    <form onSubmit={handleCreateSubmit} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="clientName" className="text-sm font-medium">
                                                    Client Name
                                                </Label>
                                                <Input
                                                    id="clientName"
                                                    name="clientName"
                                                    value={data.clientName}
                                                    onChange={(e) => setData('clientName', e.target.value)}
                                                    placeholder="Enter client name"
                                                    className="transition-all duration-200"
                                                    disabled={processing}
                                                    required
                                                />
                                                {errors.clientName && (
                                                    <p className="text-xs text-destructive">{errors.clientName}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="email" className="text-sm font-medium">
                                                    Email
                                                </Label>
                                                <Input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    value={data.email}
                                                    onChange={(e) => setData('email', e.target.value)}
                                                    placeholder="client@email.com"
                                                    className="transition-all duration-200"
                                                    disabled={processing}
                                                    required
                                                />
                                                {errors.email && (
                                                    <p className="text-xs text-destructive">{errors.email}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="rating" className="text-sm font-medium">
                                                    Rating
                                                </Label>
                                                <Select value={data.rating} onValueChange={(value) => setData('rating', value)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select rating" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="5">5 Stars - Excellent</SelectItem>
                                                        <SelectItem value="4">4 Stars - Good</SelectItem>
                                                        <SelectItem value="3">3 Stars - Average</SelectItem>
                                                        <SelectItem value="2">2 Stars - Poor</SelectItem>
                                                        <SelectItem value="1">1 Star - Very Poor</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {errors.rating && (
                                                    <p className="text-xs text-destructive">{errors.rating}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="loanType" className="text-sm font-medium">
                                                    Loan Type
                                                </Label>
                                                <Select value={data.loanType} onValueChange={(value) => setData('loanType', value)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select loan type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Educational Loan">Educational Loan</SelectItem>
                                                        <SelectItem value="Student Loan">Student Loan</SelectItem>
                                                        <SelectItem value="Personal Loan">Personal Loan</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {errors.loanType && (
                                                    <p className="text-xs text-destructive">{errors.loanType}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="comment" className="text-sm font-medium">
                                                Comment
                                            </Label>
                                            <Textarea
                                                id="comment"
                                                name="comment"
                                                value={data.comment}
                                                onChange={(e) => setData('comment', e.target.value)}
                                                placeholder="Enter client feedback..."
                                                className="transition-all duration-200"
                                                disabled={processing}
                                                rows={3}
                                                required
                                            />
                                            {errors.comment && (
                                                <p className="text-xs text-destructive">{errors.comment}</p>
                                            )}
                                        </div>

                                        <DialogFooter className="gap-2 pt-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setOpenCreate(false);
                                                    reset();
                                                }}
                                                disabled={processing}
                                            >
                                                Cancel
                                            </Button>
                                            <Button type="submit" disabled={processing || !data.clientName || !data.rating} className="min-w-[80px]">
                                                {processing ? 'Saving…' : 'Save'}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
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
                                        <TableRow className="border-b border-border/50 bg-muted/30 hover:bg-muted/30">
                                            <TableHead className="h-14 px-6 text-sm font-semibold text-foreground/90">Client</TableHead>
                                            <TableHead className="h-14 px-6 text-sm font-semibold text-foreground/90">Rating & Comment</TableHead>
                                            <TableHead className="h-14 px-6 text-sm font-semibold text-foreground/90">Details</TableHead>
                                            <TableHead className="h-14 w-32 px-6 text-right text-sm font-semibold text-foreground/90">
                                                Actions
                                            </TableHead>
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
                                                    Get started by adding your first client review to track feedback and satisfaction.
                                                </p>
                                                <Button onClick={() => setOpenCreate(true)} size="default" className="transition-all duration-200">
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Add Your First Review
                                                </Button>
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
