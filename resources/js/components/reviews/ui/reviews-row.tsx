import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TableCell, TableRow } from '@/components/ui/table';
import { ReviewRow } from '@/pages/reviews';
import { useForm } from '@inertiajs/react';
import { AlertTriangle, Calendar, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ReviewRowTemplateProps {
    index: number;
    row: ReviewRow;
}

export default function ReviewRowTemplate({ row, index }: ReviewRowTemplateProps) {
    const [openDelete, setOpenDelete] = useState(false);

    const { delete: deleteRequest, processing } = useForm();

    function handleDeleteConfirm() {
        setOpenDelete(false);

        const promise = new Promise<void>((resolve, reject) => {
            deleteRequest(`/client-reviews/${row.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    resolve();
                },
                onError: () => {
                    reject('Failed to delete review. Please try again.');
                },
            });
        });

        toast.promise(promise, {
            loading: 'Deleting review...',
            success: 'Review deleted successfully!',
            error: (message) => message,
            duration: 2000,
        });
    }

    // Helper function to get status badge variant
    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'submitted':
                return 'secondary';
            case 'reviewed':
                return 'default';
            case 'resolved':
                return 'default';
            case 'approved':
                return 'default';
            case 'pending':
                return 'secondary';
            case 'rejected':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    // Helper function to get satisfaction emoji
    const getSatisfactionEmoji = (rating: string) => {
        switch (rating) {
            case 'satisfied':
                return '😊';
            case 'neutral':
                return '😐';
            case 'dissatisfied':
                return '😞';
            default:
                return '';
        }
    };

    // Helper function to get satisfaction label
    const getSatisfactionLabel = (rating: string) => {
        switch (rating) {
            case 'satisfied':
                return 'Satisfied';
            case 'neutral':
                return 'Neutral';
            case 'dissatisfied':
                return 'Dissatisfied';
            default:
                return rating;
        }
    };

    return (
        <TableRow className="group border-b border-border/30 transition-all duration-150 hover:bg-muted/20 hover:shadow-sm">
            <TableCell className="px-6 py-5">
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 transition-all duration-200 group-hover:bg-primary/15 group-hover:ring-primary/30">
                        <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex flex-col">
                        <span className="leading-none font-medium text-foreground">{row.clientName}</span>
                        <span className="mt-1 text-xs text-muted-foreground">{row.email || 'No email provided'}</span>
                    </div>
                </div>
            </TableCell>

            <TableCell className="px-6 py-5">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">
                            {getSatisfactionEmoji(row.satisfactionRating)}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                            {getSatisfactionLabel(row.satisfactionRating)}
                        </span>
                    </div>
                    <div className="max-w-xs">
                        <p className="text-sm text-foreground line-clamp-2" title={row.comment}>
                            {row.comment}
                        </p>
                    </div>
                </div>
            </TableCell>

            <TableCell className="px-6 py-5">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                            {row.loanType}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(row.status)} className="text-xs">
                            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                        </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Transaction: {new Date(row.date).toLocaleDateString()}</span>
                        </div>
                        <div className="mt-1">
                            School: {row.schoolHei}
                        </div>
                        <div className="mt-1">
                            Submitted: {new Date(row.submittedAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </TableCell>

            <TableCell className="px-6 py-5">
                <div className="flex items-center justify-end gap-1">
                    {/* Delete Popover */}
                    <Popover open={openDelete} onOpenChange={setOpenDelete}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                title="Delete review"
                                className="h-9 w-9 p-0 text-muted-foreground transition-all duration-200 hover:scale-105 hover:bg-destructive/10 hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="end" side="bottom">
                            <div className="space-y-3 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10">
                                        <AlertTriangle className="h-4 w-4 text-destructive" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <h4 className="text-sm font-medium text-foreground">Delete review</h4>
                                        <p className="text-xs leading-relaxed text-muted-foreground">
                                            Delete review from "{row.clientName}"? This action cannot be undone.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setOpenDelete(false)}
                                        disabled={processing}
                                        className="h-8 flex-1 text-xs"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleDeleteConfirm}
                                        disabled={processing}
                                        className="h-8 flex-1 text-xs"
                                    >
                                        {processing ? 'Deleting…' : 'Delete'}
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </TableCell>
        </TableRow>
    );
}
