<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'subject',
        'date',
        'file_name',
        'file_path',
        'file_type',
        'file_size',
        'file_extension',
    ];

    protected $casts = [
        'date' => 'date',
    ];


    protected $appends = ['formatted_file_size', 'download_url', 'file_icon'];

    /**
     * Get the file size in human readable format
     */
    public function getFormattedFileSizeAttribute(): string
    {
        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Get the file download URL
     */
    public function getDownloadUrlAttribute(): string
    {
        return route('documents.download', $this->id);
    }

    /**
     * Check if file exists in storage
     */
    public function fileExists(): bool
    {
        return Storage::disk('public')->exists($this->file_path);
    }

    /**
     * Get file icon based on extension
     */
    public function getFileIconAttribute(): string
    {
        $extension = strtolower($this->file_extension);

        return match($extension) {
            'pdf' => 'file-text',
            'doc', 'docx' => 'file-text',
            'xls', 'xlsx' => 'file-spreadsheet',
            'ppt', 'pptx' => 'presentation',
            'jpg', 'jpeg', 'png', 'gif', 'bmp' => 'image',
            default => 'file'
        };
    }

    /**
     * Allowed file types for validation
     */
    public static function getAllowedMimeTypes(): array
    {
        return [
            // Images
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/bmp',
            'image/webp',

            // PDF
            'application/pdf',

            // Word Documents
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

            // Excel
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

            // PowerPoint
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ];
    }

    /**
     * Get allowed file extensions
     */
    public static function getAllowedExtensions(): array
    {
        return [
            'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', // Images
            'pdf', // PDF
            'doc', 'docx', // Word
            'xls', 'xlsx', // Excel
            'ppt', 'pptx', // PowerPoint
        ];
    }
}
