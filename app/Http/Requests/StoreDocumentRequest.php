<?php

namespace App\Http\Requests;

use App\Models\Document;
use Illuminate\Foundation\Http\FormRequest;

class StoreDocumentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Add your authorization logic if needed
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $allowedMimeTypes = implode(',', Document::getAllowedMimeTypes());
        $allowedExtensions = implode(',', Document::getAllowedExtensions());

        return [
            'subject' => ['required', 'string', 'max:255'],
            'date' => ['required', 'date'],
            'files' => ['required', 'array', 'min:1'],
            'files.*' => [
                'required',
                'file',
                'max:10240', // 10MB max
                "mimes:{$allowedExtensions}",
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'subject.required' => 'Document subject is required.',
            'date.required' => 'Document date is required.',
            'date.date' => 'Please provide a valid date.',
            'files.required' => 'Please select at least one file to upload.',
            'files.*.file' => 'Each upload must be a valid file.',
            'files.*.max' => 'File size cannot exceed 10MB.',
            'files.*.mimes' => 'Invalid file type. Please upload PDF, Word, Excel, PowerPoint, or image files.',
        ];
    }
}
