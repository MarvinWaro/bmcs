import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { ReviewRow } from '@/pages/reviews';
import { Calendar, User } from 'lucide-react';

interface ReviewRowTemplateProps {
    index: number;
    row: ReviewRow;
}

export default function ReviewRowTemplate({ row, index }: ReviewRowTemplateProps) {
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
            <TableCell className="px-6 py-4 w-[280px]">
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

            <TableCell className="px-6 py-4 w-[350px]">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">
                            {getSatisfactionEmoji(row.satisfactionRating)}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                            {getSatisfactionLabel(row.satisfactionRating)}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm text-foreground line-clamp-2 leading-relaxed" title={row.comment}>
                            {row.comment}
                        </p>
                    </div>
                </div>
            </TableCell>

            <TableCell className="px-6 py-4 pr-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                            {row.loanType}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(row.status)} className="text-xs whitespace-nowrap">
                            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                        </Badge>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span className="whitespace-nowrap">{new Date(row.date).toLocaleDateString()}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 text-right">
                            <div className="truncate max-w-[200px]" title={row.schoolHei}>
                                {row.schoolHei}
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground/70 mt-1 text-right">
                            Submitted: {new Date(row.submittedAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </TableCell>
        </TableRow>
    );
}
