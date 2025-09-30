<?php

namespace App\Http\Requests;

use App\Models\Document;
use Illuminate\Foundation\Http\FormRequest;

class UpdateDocumentRequest extends FormRequest
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
        $allowedExtensions = implode(',', Document::getAllowedExtensions());

        return [
            'subject' => ['required', 'string', 'max:255'],
            'date' => ['required', 'date'],
            'file' => ['nullable', 'file', 'max:10240', "mimes:{$allowedExtensions}"],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'subject.required' => 'Document subject is required.',
            'subject.max' => 'Subject cannot exceed 255 characters.',
            'date.required' => 'Document date is required.',
            'date.date' => 'Please provide a valid date.',
            'file.file' => 'The uploaded file must be valid.',
            'file.max' => 'File size cannot exceed 10MB.',
            'file.mimes' => 'Invalid file type. Please upload PDF, Word, Excel, PowerPoint, or image files.',
        ];
    }
}
