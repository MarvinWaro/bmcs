import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TableCell, TableRow } from '@/components/ui/table';
import { ReviewRow } from '@/pages/reviews';
import { Calendar, ChevronDown, ChevronUp, Eye, User } from 'lucide-react';
import { useMemo, useState } from 'react';

interface ReviewRowTemplateProps {
    index: number;
    row: ReviewRow;
}

export default function ReviewRowTemplate({ row }: ReviewRowTemplateProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showFullComment, setShowFullComment] = useState(false);

    const comment = row.comment || '';
    const isCommentLong = comment.length > 100;
    const displayComment = isExpanded ? comment : comment.slice(0, 100);

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'submitted':
            case 'pending':
                return 'secondary';
            case 'reviewed':
            case 'resolved':
            case 'approved':
                return 'default';
            case 'rejected':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const getSatisfactionEmoji = (rating: ReviewRow['satisfactionRating']) => (rating === 'satisfied' ? '😊' : '😞');

    const getSatisfactionLabel = (rating: ReviewRow['satisfactionRating']) => (rating === 'satisfied' ? 'Satisfied' : 'Dissatisfied');

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        return isNaN(d.getTime()) ? dateString : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const formatSubmittedDate = (dateTimeString: string) => {
        const dateOnly = (dateTimeString || '').split(' ')[0] || dateTimeString;
        const d = new Date(dateOnly);
        return isNaN(d.getTime()) ? dateOnly : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    // memo to avoid recalcs
    const submitted = useMemo(() => formatSubmittedDate(row.submittedAt), [row.submittedAt]);

    return (
        <TableRow className="group border-b border-border/30 transition-all duration-150 hover:bg-muted/20 hover:shadow-sm">
            {/* Client */}
            <TableCell className="w-[25%] px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20 transition-all duration-200 group-hover:bg-primary/15 group-hover:ring-primary/30">
                        <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium text-foreground">{row.clientName}</span>
                        <span className="truncate text-xs text-muted-foreground">{row.email || 'No email provided'}</span>
                    </div>
                </div>
            </TableCell>

            {/* Rating & Comment */}
            <TableCell className="w-[45%] px-6 py-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{getSatisfactionEmoji(row.satisfactionRating)}</span>
                        <span className="text-sm font-medium text-foreground">{getSatisfactionLabel(row.satisfactionRating)}</span>
                    </div>

                    <div className="space-y-2">
                        <div className="relative">
                            <p className="text-sm leading-relaxed text-foreground">
                                {displayComment}
                                {!isExpanded && isCommentLong && '...'}
                            </p>

                            {isCommentLong && (
                                <div className="mt-2 flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsExpanded((v) => !v)}
                                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                    >
                                        {isExpanded ? (
                                            <>
                                                <ChevronUp className="mr-1 h-3 w-3" />
                                                Show less
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="mr-1 h-3 w-3" />
                                                Show more
                                            </>
                                        )}
                                    </Button>

                                    <Popover open={showFullComment} onOpenChange={setShowFullComment}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                            >
                                                <Eye className="mr-1 h-3 w-3" />
                                                View
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 p-4" align="start" side="top">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{getSatisfactionEmoji(row.satisfactionRating)}</span>
                                                    <span className="text-sm font-semibold">{row.clientName}'s Feedback</span>
                                                </div>
                                                <div className="max-h-60 overflow-y-auto text-sm leading-relaxed text-foreground">{row.comment}</div>
                                                <div className="border-t pt-2">
                                                    <div className="text-xs text-muted-foreground">
                                                        {row.loanType} • {submitted}
                                                    </div>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </TableCell>

            {/* Details */}
            <TableCell className="w-[30%] px-6 py-4 pr-6">
                <div className="flex flex-col items-start space-y-3">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                            {row.loanType}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(row.status)} className="text-xs whitespace-nowrap">
                            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                        </Badge>
                    </div>

                    <div className="space-y-1 text-left">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span className="whitespace-nowrap">{formatDate(row.date)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            <div className="max-w-full truncate" title={row.schoolHei}>
                                {row.schoolHei}
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground/70">Submitted: {submitted}</div>
                    </div>
                </div>
            </TableCell>
        </TableRow>
    );
}
