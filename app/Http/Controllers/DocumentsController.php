<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Http\Requests\StoreDocumentRequest;
use App\Http\Requests\UpdateDocumentRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentsController extends Controller
{
    /**
     * Display a listing of documents.
     */
    public function index(): Response
    {
        $documents = Document::latest('date')
            ->latest('created_at')
            ->get()
            ->map(function ($document) {
                return [
                    'id' => $document->id,
                    'subject' => $document->subject,
                    'date' => $document->date->format('M d, Y'),
                    'date_raw' => $document->date->format('Y-m-d'),
                    'file_name' => $document->file_name,
                    'file_type' => $document->file_type,
                    'file_extension' => $document->file_extension,
                    'formatted_file_size' => $document->formatted_file_size,
                    'file_icon' => $document->file_icon,
                    'created_at' => $document->created_at->format('M d, Y g:i A'),
                ];
            });

        return Inertia::render('documents/index', [
            'title' => 'Documents',
            'documents' => $documents,
        ]);
    }

    /**
     * Store newly uploaded documents.
     */
    public function store(StoreDocumentRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $uploadedFiles = [];

        try {
            foreach ($request->file('files') as $file) {
                // Generate unique filename
                $originalName = $file->getClientOriginalName();
                $extension = $file->getClientOriginalExtension();
                $filename = pathinfo($originalName, PATHINFO_FILENAME);
                $uniqueFilename = $filename . '_' . time() . '_' . uniqid() . '.' . $extension;

                // Store file
                $path = $file->storeAs('documents', $uniqueFilename, 'public');

                // Create document record
                $document = Document::create([
                    'subject' => $validated['subject'],
                    'date' => $validated['date'],
                    'file_name' => $originalName,
                    'file_path' => $path,
                    'file_type' => $file->getMimeType(),
                    'file_size' => $file->getSize(),
                    'file_extension' => $extension,
                ]);

                $uploadedFiles[] = $document;
            }

            $count = count($uploadedFiles);
            $message = $count === 1
                ? 'Document uploaded successfully.'
                : "{$count} documents uploaded successfully.";

            return redirect()
                ->route('documents.index')
                ->with('success', $message);

        } catch (\Exception $e) {
            // Cleanup uploaded files if error occurs
            foreach ($uploadedFiles as $doc) {
                if ($doc->fileExists()) {
                    Storage::disk('public')->delete($doc->file_path);
                }
                $doc->delete();
            }

            return redirect()
                ->back()
                ->with('error', 'Failed to upload documents. Please try again.');
        }
    }

    /**
     * Update document metadata and optionally replace the file.
     */
    public function update(UpdateDocumentRequest $request, Document $document): RedirectResponse
    {
        try {
            $validated = $request->validated();

            // Update subject and date
            $document->subject = $validated['subject'];
            $document->date = $validated['date'];

            // Check if a new file is uploaded
            if ($request->hasFile('file')) {
                $file = $request->file('file');

                // Delete old file
                if ($document->fileExists()) {
                    Storage::disk('public')->delete($document->file_path);
                }

                // Generate unique filename for new file
                $originalName = $file->getClientOriginalName();
                $extension = $file->getClientOriginalExtension();
                $filename = pathinfo($originalName, PATHINFO_FILENAME);
                $uniqueFilename = $filename . '_' . time() . '_' . uniqid() . '.' . $extension;

                // Store new file
                $path = $file->storeAs('documents', $uniqueFilename, 'public');

                // Update file information
                $document->file_name = $originalName;
                $document->file_path = $path;
                $document->file_type = $file->getMimeType();
                $document->file_size = $file->getSize();
                $document->file_extension = $extension;
            }

            $document->save();

            return redirect()
                ->route('documents.index')
                ->with('success', 'Document updated successfully.');

        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->with('error', 'Failed to update document. Please try again.');
        }
    }

    /**
     * Download a document.
     */
    public function download(Document $document): StreamedResponse
    {
        if (!$document->fileExists()) {
            abort(404, 'File not found.');
        }

        return Storage::disk('public')->download(
            $document->file_path,
            $document->file_name
        );
    }

    /**
     * Remove a document.
     */
    public function destroy(Document $document): RedirectResponse
    {
        try {
            // Delete file from storage
            if ($document->fileExists()) {
                Storage::disk('public')->delete($document->file_path);
            }

            // Delete database record
            $document->delete();

            return redirect()
                ->route('documents.index')
                ->with('success', 'Document deleted successfully.');

        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->with('error', 'Failed to delete document. Please try again.');
        }
    }
}
