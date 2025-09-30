import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, router } from '@inertiajs/react';
import clsx from 'clsx';
import { CloudUpload, Download, FileText, Trash2, X, Calendar, Pencil, Search, AlertTriangle } from 'lucide-react';
import { useRef, useState, FormEvent } from 'react';
import { toast } from 'sonner';

type Document = {
    id: number;
    subject: string;
    date: string;
    date_raw: string;
    file_name: string;
    file_type: string;
    file_extension: string;
    formatted_file_size: string;
    file_icon: string;
    created_at: string;
};

type PageProps = {
    title?: string;
    documents: Document[];
};

const breadcrumbs = [{ title: 'Documents', href: '/documents' }];

export default function DocumentsIndex({ title = 'Documents', documents = [] }: PageProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [deletePopover, setDeletePopover] = useState<{ open: boolean; documentId: number | null }>({
        open: false,
        documentId: null,
    });
    const [editDialog, setEditDialog] = useState<{ open: boolean; document: Document | null }>({
        open: false,
        document: null,
    });
    const [selectedEditFile, setSelectedEditFile] = useState<File | null>(null);
    const editFileInputRef = useRef<HTMLInputElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        subject: '',
        date: '',
        files: [] as File[],
    });

    const editForm = useForm({
        subject: '',
        date: '',
        file: null as File | null,
    });

    const filteredDocuments = documents.filter(
        (doc) =>
            doc.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.file_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleFileSelect = (files: FileList | null) => {
        if (!files) return;

        const fileArray = Array.from(files);
        const pdfFiles = fileArray.filter(file =>
            file.type === 'application/pdf' ||
            file.name.toLowerCase().endsWith('.pdf')
        );

        setSelectedFiles(prev => [...prev, ...pdfFiles]);
        setData('files', [...data.files, ...pdfFiles]);
    };

    const removeFile = (index: number) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(newFiles);
        setData('files', newFiles);
    };

    const clearAll = () => {
        setSelectedFiles([]);
        setData('files', []);
        setData('subject', '');
        setData('date', '');
        reset('files');
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        const promise = new Promise<void>((resolve, reject) => {
            post('/documents', {
                preserveScroll: true,
                onSuccess: () => {
                    clearAll();
                    resolve();
                },
                onError: () => {
                    reject('Failed to upload documents. Please try again.');
                },
            });
        });

        toast.promise(promise, {
            loading: 'Uploading documents...',
            success: 'Documents uploaded successfully!',
            error: (message) => message,
            duration: 2000,
        });
    };

    const handleDownload = (documentId: number) => {
        window.location.href = `/documents/${documentId}/download`;
    };

    const handleEdit = (document: Document) => {
        editForm.setData({
            subject: document.subject,
            date: document.date_raw,
            file: null,
        });
        setSelectedEditFile(null);
        setEditDialog({ open: true, document });
    };

    const handleEditFileSelect = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        setSelectedEditFile(file);
        editForm.setData('file', file);
    };

    const removeEditFile = () => {
        setSelectedEditFile(null);
        editForm.setData('file', null);
        if (editFileInputRef.current) {
            editFileInputRef.current.value = '';
        }
    };

    const confirmEdit = (e: FormEvent) => {
        e.preventDefault();
        if (editDialog.document) {
            const documentId = editDialog.document.id;
            setEditDialog({ open: false, document: null });

            const promise = new Promise<void>((resolve, reject) => {
                editForm.post(`/documents/${documentId}`, {
                    preserveScroll: true,
                    onSuccess: () => {
                        editForm.reset();
                        setSelectedEditFile(null);
                        resolve();
                    },
                    onError: () => {
                        reject('Failed to update document. Please try again.');
                    },
                });
            });

            toast.promise(promise, {
                loading: 'Updating document...',
                success: 'Document updated successfully!',
                error: (message) => message,
                duration: 2000,
            });
        }
    };

    const handleDeleteClick = (documentId: number) => {
        setDeletePopover({ open: true, documentId });
    };

    const confirmDelete = () => {
        if (deletePopover.documentId) {
            setDeletePopover({ open: false, documentId: null });

            const promise = new Promise<void>((resolve, reject) => {
                router.delete(`/documents/${deletePopover.documentId}`, {
                    preserveScroll: true,
                    onSuccess: () => {
                        resolve();
                    },
                    onError: () => {
                        reject('Failed to delete document. Please try again.');
                    },
                });
            });

            toast.promise(promise, {
                loading: 'Deleting document...',
                success: 'Document deleted successfully!',
                error: (message) => message,
                duration: 2000,
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />

            <div className="bg-background pb-6">
                <div className="space-y-4">
                    {/* Header Section */}
                    <div className="space-y-2 px-6 pt-6">
                        <div className="space-y-1">
                            <h5 className="text-xl font-bold tracking-tight text-foreground">{title}</h5>
                            <p className="text-sm text-muted-foreground">
                                Upload and organize PDF memorandums and other official documents.
                            </p>
                        </div>
                    </div>

                    {/* Upload Form */}
                    <div className="px-6">
                        <Card className="mx-auto w-full max-w-3xl rounded-2xl border bg-card p-6 shadow-sm">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Subject and Date Fields */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Subject *</Label>
                                        <Input
                                            id="subject"
                                            type="text"
                                            placeholder="Document subject or title"
                                            value={data.subject}
                                            onChange={e => setData('subject', e.target.value)}
                                            className={errors.subject ? 'border-red-500' : ''}
                                        />
                                        {errors.subject && (
                                            <p className="text-xs text-red-500">{errors.subject}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="date">Date *</Label>
                                        <Input
                                            id="date"
                                            type="date"
                                            value={data.date}
                                            onChange={e => setData('date', e.target.value)}
                                            className={errors.date ? 'border-red-500' : ''}
                                        />
                                        {errors.date && (
                                            <p className="text-xs text-red-500">{errors.date}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Dropzone */}
                                <div
                                    className={clsx(
                                        'flex h-40 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed transition-colors',
                                        isDragging ? 'border-primary/70 bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/40',
                                        errors.files ? 'border-red-500' : ''
                                    )}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => inputRef.current?.click()}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setIsDragging(true);
                                    }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setIsDragging(false);
                                        handleFileSelect(e.dataTransfer.files);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            inputRef.current?.click();
                                        }
                                    }}
                                >
                                    <div className="text-center">
                                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                            <CloudUpload className="h-6 w-6 text-primary" />
                                        </div>
                                        <p className="text-base font-medium">Browse files to upload</p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Drag & drop PDF files here, or click to choose
                                        </p>

                                        <Input
                                            ref={inputRef}
                                            type="file"
                                            className="hidden"
                                            multiple
                                            accept="application/pdf,.pdf"
                                            onChange={e => handleFileSelect(e.target.files)}
                                        />
                                    </div>
                                </div>
                                {errors.files && (
                                    <p className="text-xs text-red-500">{errors.files}</p>
                                )}

                                {/* Selected Files List */}
                                {selectedFiles.length > 0 && (
                                    <div className="space-y-2 rounded-lg border p-3">
                                        <p className="text-sm font-medium">Selected Files ({selectedFiles.length})</p>
                                        <div className="space-y-1">
                                            {selectedFiles.map((file, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                                                >
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                                        <span className="truncate text-sm">{file.name}</span>
                                                        <span className="flex-shrink-0 text-xs text-muted-foreground">
                                                            ({(file.size / 1024).toFixed(1)} KB)
                                                        </span>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeFile(index)}
                                                        className="h-6 w-6 p-0"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={clearAll}
                                        disabled={processing || selectedFiles.length === 0}
                                    >
                                        Clear
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing || selectedFiles.length === 0 || !data.subject || !data.date}
                                    >
                                        {processing ? 'Uploading...' : 'Upload Documents'}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>

                    {/* Stats and Search Section */}
                    <div className="flex flex-col gap-4 px-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium">
                                {documents.length} {documents.length === 1 ? 'Document' : 'Documents'}
                            </Badge>
                            {searchQuery && (
                                <Badge variant="outline" className="px-3 py-1.5 text-sm">
                                    {filteredDocuments.length} filtered
                                </Badge>
                            )}
                        </div>

                        {/* Search */}
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search documents..."
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
                                            <TableHead className="h-14 px-6 text-sm font-semibold text-foreground/90">Subject</TableHead>
                                            <TableHead className="h-14 px-6 text-sm font-semibold text-foreground/90">File Name</TableHead>
                                            <TableHead className="h-14 px-6 text-sm font-semibold text-foreground/90">Date</TableHead>
                                            <TableHead className="h-14 px-6 text-sm font-semibold text-foreground/90">Size</TableHead>
                                            <TableHead className="h-14 w-32 px-6 text-right text-sm font-semibold text-foreground/90">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {filteredDocuments.map((document, index) => (
                                            <TableRow key={document.id} className="group border-b border-border/30 transition-all duration-150 hover:bg-muted/20 hover:shadow-sm">
                                                <TableCell className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 transition-all duration-200 group-hover:bg-primary/15 group-hover:ring-primary/30">
                                                            <FileText className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="leading-none font-medium text-foreground">{document.subject}</span>
                                                            <span className="mt-1 text-xs text-muted-foreground">Document #{index + 1}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-5">
                                                    <span className="text-sm text-muted-foreground">{document.file_name}</span>
                                                </TableCell>
                                                <TableCell className="px-6 py-5">
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <Calendar className="h-3 w-3" />
                                                        {document.date}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-5">
                                                    <span className="text-sm text-muted-foreground">{document.formatted_file_size}</span>
                                                </TableCell>
                                                <TableCell className="px-6 py-5">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            title="Edit metadata"
                                                            onClick={() => handleEdit(document)}
                                                            className="h-9 w-9 p-0 text-muted-foreground transition-all duration-200 hover:scale-105 hover:bg-muted/60 hover:text-foreground"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            title="Download"
                                                            onClick={() => handleDownload(document.id)}
                                                            className="h-9 w-9 p-0 text-muted-foreground transition-all duration-200 hover:scale-105 hover:bg-muted/60 hover:text-foreground"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>

                                                        {/* Delete Popover */}
                                                        <Popover
                                                            open={deletePopover.open && deletePopover.documentId === document.id}
                                                            onOpenChange={(open) => {
                                                                if (open) {
                                                                    setDeletePopover({ open: true, documentId: document.id });
                                                                } else {
                                                                    setDeletePopover({ open: false, documentId: null });
                                                                }
                                                            }}
                                                        >
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    title="Delete document"
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
                                                                            <h4 className="text-sm font-medium text-foreground">Delete document</h4>
                                                                            <p className="text-xs leading-relaxed text-muted-foreground">
                                                                                Delete "{document.subject}"? This action cannot be undone.
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center gap-2 pt-1">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => setDeletePopover({ open: false, documentId: null })}
                                                                            className="h-8 flex-1 text-xs"
                                                                        >
                                                                            Cancel
                                                                        </Button>
                                                                        <Button
                                                                            variant="destructive"
                                                                            size="sm"
                                                                            onClick={confirmDelete}
                                                                            className="h-8 flex-1 text-xs"
                                                                        >
                                                                            Delete
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Enhanced Empty states */}
                                {filteredDocuments.length === 0 && (
                                    <div className="flex flex-col items-center justify-center px-6 py-20">
                                        {searchQuery ? (
                                            <>
                                                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50">
                                                    <Search className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                                <h3 className="mb-2 text-xl font-semibold text-foreground">No documents found</h3>
                                                <p className="mb-6 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
                                                    No documents match your search for "{searchQuery}". Try adjusting your search terms.
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
                                                    <FileText className="h-8 w-8 text-primary" />
                                                </div>
                                                <h3 className="mb-2 text-xl font-semibold text-foreground">No documents yet</h3>
                                                <p className="mb-8 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
                                                    Upload your first document using the form above.
                                                </p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Edit Document Dialog */}
            <Dialog open={editDialog.open} onOpenChange={(open) => {
                if (!open) {
                    setEditDialog({ open: false, document: null });
                    setSelectedEditFile(null);
                    editForm.reset();
                }
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                <Pencil className="h-4 w-4 text-primary" />
                            </div>
                            Edit Document
                        </DialogTitle>
                        <DialogDescription>
                            Update the document information and optionally replace the file.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={confirmEdit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-subject" className="text-sm font-medium">Subject *</Label>
                            <Input
                                id="edit-subject"
                                type="text"
                                placeholder="Document subject or title"
                                value={editForm.data.subject}
                                onChange={e => editForm.setData('subject', e.target.value)}
                                className={editForm.errors.subject ? 'border-red-500' : ''}
                                disabled={editForm.processing}
                            />
                            {editForm.errors.subject && (
                                <p className="text-xs text-red-500">{editForm.errors.subject}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-date" className="text-sm font-medium">Date *</Label>
                            <Input
                                id="edit-date"
                                type="date"
                                value={editForm.data.date}
                                onChange={e => editForm.setData('date', e.target.value)}
                                className={editForm.errors.date ? 'border-red-500' : ''}
                                disabled={editForm.processing}
                            />
                            {editForm.errors.date && (
                                <p className="text-xs text-red-500">{editForm.errors.date}</p>
                            )}
                        </div>

                        {/* Current File Info */}
                        {editDialog.document && !selectedEditFile && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Current File</Label>
                                <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                        <span className="truncate text-sm">{editDialog.document.file_name}</span>
                                        <span className="flex-shrink-0 text-xs text-muted-foreground">
                                            ({editDialog.document.formatted_file_size})
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* File Upload */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-file" className="text-sm font-medium">
                                Replace File (Optional)
                            </Label>

                            {selectedEditFile ? (
                                <div className="flex items-center justify-between rounded-md border bg-primary/5 px-3 py-2">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <FileText className="h-4 w-4 flex-shrink-0 text-primary" />
                                        <span className="truncate text-sm font-medium">{selectedEditFile.name}</span>
                                        <span className="flex-shrink-0 text-xs text-muted-foreground">
                                            ({(selectedEditFile.size / 1024).toFixed(1)} KB)
                                        </span>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={removeEditFile}
                                        className="h-6 w-6 p-0"
                                        disabled={editForm.processing}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Input
                                        ref={editFileInputRef}
                                        id="edit-file"
                                        type="file"
                                        accept="application/pdf,.pdf"
                                        onChange={e => handleEditFileSelect(e.target.files)}
                                        className="flex-1"
                                        disabled={editForm.processing}
                                    />
                                </div>
                            )}
                            {editForm.errors.file && (
                                <p className="text-xs text-red-500">{editForm.errors.file}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Leave empty to keep the current file, or upload a new file to replace it.
                            </p>
                        </div>

                        <DialogFooter className="gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setEditDialog({ open: false, document: null });
                                    setSelectedEditFile(null);
                                    editForm.reset();
                                }}
                                disabled={editForm.processing}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={editForm.processing} className="min-w-[120px]">
                                {editForm.processing ? 'Saving changes…' : 'Save changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
