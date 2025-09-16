import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TableCell, TableRow } from '@/components/ui/table';
import { ReviewRow } from '@/pages/reviews';
import { Calendar, User, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { useState } from 'react';

interface ReviewRowTemplateProps {
    index: number;
    row: ReviewRow;
}

export default function ReviewRowTemplate({ row, index }: ReviewRowTemplateProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showFullComment, setShowFullComment] = useState(false);

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

    // Check if comment is long enough to truncate
    const isCommentLong = row.comment.length > 100;
    const displayComment = isExpanded ? row.comment : row.comment.slice(0, 100);

    return (
        <>
            <TableRow className="group border-b border-border/30 transition-all duration-150 hover:bg-muted/20 hover:shadow-sm">
                <TableCell className="px-6 py-4 w-[25%]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20 transition-all duration-200 group-hover:bg-primary/15 group-hover:ring-primary/30">
                            <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="font-medium text-foreground truncate">{row.clientName}</span>
                            <span className="text-xs text-muted-foreground truncate">{row.email || 'No email provided'}</span>
                        </div>
                    </div>
                </TableCell>

                <TableCell className="px-6 py-4 w-[45%]">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">
                                {getSatisfactionEmoji(row.satisfactionRating)}
                            </span>
                            <span className="text-sm font-medium text-foreground">
                                {getSatisfactionLabel(row.satisfactionRating)}
                            </span>
                        </div>
                        <div className="space-y-2">
                            <div className="relative">
                                <p className="text-sm text-foreground leading-relaxed">
                                    {displayComment}
                                    {!isExpanded && isCommentLong && '...'}
                                </p>
                                {isCommentLong && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsExpanded(!isExpanded)}
                                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                        >
                                            {isExpanded ? (
                                                <>
                                                    <ChevronUp className="h-3 w-3 mr-1" />
                                                    Show less
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="h-3 w-3 mr-1" />
                                                    Show more
                                                </>
                                            )}
                                        </Button>

                                        {/* Alternative: Popover for full comment */}
                                        <Popover open={showFullComment} onOpenChange={setShowFullComment}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                                >
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    View
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80 p-4" align="start" side="top">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">
                                                            {getSatisfactionEmoji(row.satisfactionRating)}
                                                        </span>
                                                        <span className="text-sm font-semibold">
                                                            {row.clientName}'s Feedback
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-foreground leading-relaxed max-h-60 overflow-y-auto">
                                                        {row.comment}
                                                    </div>
                                                    <div className="pt-2 border-t">
                                                        <div className="text-xs text-muted-foreground">
                                                            {row.loanType} • {new Date(row.submittedAt).toLocaleDateString()}
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

                <TableCell className="px-6 py-4 pr-6 w-[30%]">
                    <div className="flex flex-col items-start space-y-3">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs whitespace-nowrap">
                                {row.loanType}
                            </Badge>
                            <Badge variant={getStatusBadgeVariant(row.status)} className="text-xs whitespace-nowrap">
                                {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                            </Badge>
                        </div>
                        <div className="text-left space-y-1">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span className="whitespace-nowrap">{new Date(row.date).toLocaleDateString()}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                <div className="truncate max-w-full" title={row.schoolHei}>
                                    {row.schoolHei}
                                </div>
                            </div>
                            <div className="text-xs text-muted-foreground/70">
                                Submitted: {new Date(row.submittedAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </TableCell>
            </TableRow>
        </>
    );
}
