<?php

namespace App\Exports;

use App\Models\ClientSatisfactionSurvey;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithCustomStartCell;
use Maatwebsite\Excel\Events\BeforeSheet;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use Carbon\Carbon;

class ClientSatisfactionSurveysExport implements
    FromQuery,
    WithMapping,
    WithHeadings,
    WithCustomStartCell,
    ShouldAutoSize,
    WithEvents
{
    public function __construct(
        protected array $filters = []
    ) {}

    /** Build the base query with the same filters you use on the index */
    public function query(): Builder
    {
        $q = ClientSatisfactionSurvey::query()->with('school');

        // satisfaction
        if (!empty($this->filters['satisfaction_rating']) && $this->filters['satisfaction_rating'] !== 'all') {
            $q->where('satisfaction_rating', $this->filters['satisfaction_rating']);
        }

        // school: id or "other"
        if (!empty($this->filters['school_id']) && $this->filters['school_id'] !== 'all') {
            if ($this->filters['school_id'] === 'other') {
                $q->whereNull('school_id')->whereNotNull('other_school_specify');
            } else {
                $q->where('school_id', $this->filters['school_id']);
            }
        }

        // transaction type
        if (!empty($this->filters['transaction_type']) && $this->filters['transaction_type'] !== 'all') {
            $q->where('transaction_type', $this->filters['transaction_type']);
        }

        // date_range - FIXED: Now matches controller logic exactly (transaction_date ONLY)
        if (!empty($this->filters['date_range']) && $this->filters['date_range'] !== 'all') {
            $tz = config('app.timezone');

            switch ($this->filters['date_range']) {
                case 'today':
                    $today = Carbon::now($tz)->toDateString();
                    $q->whereDate('transaction_date', $today);
                    break;

                case 'this_week':
                    $start = Carbon::now($tz)->startOfWeek()->toDateString();
                    $end   = Carbon::now($tz)->endOfWeek()->toDateString();
                    $q->whereBetween('transaction_date', [$start, $end]);
                    break;

                case 'this_month':
                    $month = Carbon::now($tz)->month;
                    $year  = Carbon::now($tz)->year;
                    $q->whereMonth('transaction_date', $month)
                      ->whereYear('transaction_date', $year);
                    break;

                case 'this_year':
                    $year = Carbon::now($tz)->year;
                    $q->whereYear('transaction_date', $year);
                    break;

                case 'last_30_days':
                    $from = Carbon::now($tz)->subDays(30)->toDateString();
                    $q->where('transaction_date', '>=', $from);
                    break;
            }
        }

        // custom date range (start_date/end_date) - transaction_date ONLY
        if (!empty($this->filters['start_date']) && !empty($this->filters['end_date'])) {
            $q->whereBetween('transaction_date', [$this->filters['start_date'], $this->filters['end_date']]);
        }

        // search - FIXED: Now matches controller logic exactly
        if (!empty($this->filters['search'])) {
            $term = $this->filters['search'];
            $q->where(function ($qq) use ($term) {
                $qq->where(function ($nq) use ($term) {
                    $nq->where('first_name',  'like', "%{$term}%")
                       ->orWhere('middle_name','like', "%{$term}%")
                       ->orWhere('last_name',  'like', "%{$term}%");
                })
                ->orWhere('email', 'like', "%{$term}%")
                ->orWhere('reason', 'like', "%{$term}%")
                ->orWhere('other_school_specify', 'like', "%{$term}%")
                ->orWhereHas('school', function ($sq) use ($term) {
                    $sq->where('name', 'like', "%{$term}%");
                });
            });
        }

        return $q->orderBy('created_at', 'desc');
    }

    /** Map each row to our columns */
    public function map($survey): array
    {
        // school name (db school or "other")
        $school = $survey->school?->name ?? ($survey->other_school_specify ?: '');

        return [
            optional($survey->transaction_date)->format('Y-m-d'),
            $survey->first_name,
            $survey->middle_name,
            $survey->last_name,
            $survey->email,
            $school,
            $survey->full_transaction_type, // if you prefer raw $survey->transaction_type, replace this
            ucfirst($survey->satisfaction_rating),
            $survey->reason,
        ];
    }

    /**
     * Sub-header row (Row 3 in the screenshot).
     * Data will begin right below it (Row 4).
     */
    public function headings(): array
    {
        return [
            // B3..J3
            ['DATE', 'FIRST NAME', 'MIDDLE NAME', 'LAST NAME', 'EMAIL', "SCHOOL / HEI'S", 'TYPE OF TRANSACTION', 'SATISFACTION RATING', 'REASON/COMMENTS'],
        ];
    }

    /** We want our headings to start at B3 (leaving col A empty and Row 2 for the grouped band) */
    public function startCell(): string
    {
        return 'B3';
    }

    /** Build the fancy header band + styling + freeze panes */
    public function registerEvents(): array
    {
        return [
            BeforeSheet::class => function (BeforeSheet $event) {
                $sheet = $event->sheet->getDelegate();

                // Row 2 labels (group header band)
                $sheet->setCellValue('B2', 'DATE');
                $sheet->setCellValue('C2', 'CLIENT INFO');
                $sheet->setCellValue('G2', "SCHOOL / HEI'S");
                $sheet->setCellValue('H2', 'TYPE OF TRANSACTION');
                $sheet->setCellValue('I2', 'SATISFACTION RATING');
                $sheet->setCellValue('J2', 'REASON/COMMENTS');

                // Merge for the band:
                // DATE (B2:B3), CLIENT INFO (C2:F2), others span two rows each
                $sheet->mergeCells('B2:B3');
                $sheet->mergeCells('C2:F2');
                $sheet->mergeCells('G2:G3');
                $sheet->mergeCells('H2:H3');
                $sheet->mergeCells('I2:I3');
                $sheet->mergeCells('J2:J3');
            },

            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                // Style ranges
                $bandRange   = 'B2:J2'; // grouped band
                $row3Range   = 'B3:J3'; // sub headers
                $headerRange = 'B2:J3'; // whole header block

                // Fill + alignment for band and subheaders
                $sheet->getStyle($headerRange)->getAlignment()
                    ->setHorizontal(Alignment::HORIZONTAL_CENTER)
                    ->setVertical(Alignment::VERTICAL_CENTER)
                    ->setWrapText(true);

                // Bold text on the whole header
                $sheet->getStyle($headerRange)->getFont()->setBold(true);

                // Light gray fill (like your mock)
                $fill = function (string $range) use ($sheet) {
                    $sheet->getStyle($range)->getFill()->setFillType(Fill::FILL_SOLID)
                          ->getStartColor()->setARGB('FFF2F2F2'); // very light gray
                };
                $fill($bandRange);
                $fill($row3Range);

                // Borders for the whole header block
                $sheet->getStyle($headerRange)->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);

                // Adjust row heights
                $sheet->getRowDimension(2)->setRowHeight(24);
                $sheet->getRowDimension(3)->setRowHeight(22);

                // Freeze pane below headers (so row 4 is the first scrollable row)
                $sheet->freezePane('B4');
            },
        ];
    }
}
