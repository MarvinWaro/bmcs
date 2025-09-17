import SchoolRowTemplate from '@/components/schools/ui/school-row';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { Plus, Search, GraduationCap } from 'lucide-react';
import { FormEvent, useState, useEffect } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Schools', href: '/schools' }];

export type Row = { id: string; name: string }; // Changed id to string to match ULID
type PageProps = { schools: Row[] };

export default function SchoolsIndex() {
    const { props } = usePage<PageProps>();
    const rows = props.schools ?? [];

    const [searchQuery, setSearchQuery] = useState('');
    const filteredRows = rows.filter((row) => row.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // -------------------------
    // Create modal + form
    // -------------------------
    const [openCreate, setOpenCreate] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({ name: '' });

    // Reset form whenever dialog opens
    useEffect(() => {
        if (openCreate) {
            reset();
            setData({ name: '' });
        }
    }, [openCreate]);

    function handleCreateSubmit(e: FormEvent) {
        e.preventDefault();

        post('/schools', {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('School created successfully!');
                setOpenCreate(false);
            },
            onError: () => {
                toast.error('Failed to create school. Please try again.');
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Schools" />

            <div className="bg-background pb-6">
                <div className="space-y-4">
                    {/* Header Section */}
                    <div className="space-y-2 px-6 pt-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h5 className="text-xl font-bold tracking-tight text-foreground">Schools Management</h5>
                                <p className="text-sm text-muted-foreground">Manage schools and higher education institutions</p>
                            </div>

                            {/* Create modal trigger */}
                            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                                <DialogTrigger asChild>
                                    <Button size="default" className="shadow-sm">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add School
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                                <GraduationCap className="h-4 w-4 text-primary" />
                                            </div>
                                            Add New School
                                        </DialogTitle>
                                        <DialogDescription>Add a new school or higher education institution to the system.</DialogDescription>
                                    </DialogHeader>

                                    <form onSubmit={handleCreateSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-sm font-medium">
                                                School Name
                                            </Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="e.g., University of the Philippines, Ateneo de Manila"
                                                className="transition-all duration-200"
                                                aria-invalid={!!errors.name}
                                                aria-describedby={errors.name ? 'name-error' : undefined}
                                                disabled={processing}
                                                required
                                            />
                                            {errors.name && (
                                                <p id="name-error" className="flex items-center gap-1 text-xs text-destructive">
                                                    {errors.name}
                                                </p>
                                            )}
                                        </div>

                                        <DialogFooter className="gap-2 pt-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setOpenCreate(false)}
                                                disabled={processing}
                                            >
                                                Cancel
                                            </Button>
                                            <Button type="submit" disabled={processing || !data.name} className="min-w-[80px]">
                                                {processing ? 'Saving…' : 'Save'}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {/* Stats and Search Section */}
                    <div className="flex flex-col gap-4 px-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium">
                                {rows.length} {rows.length === 1 ? 'School' : 'Schools'}
                            </Badge>
                            {searchQuery && (
                                <Badge variant="outline" className="px-3 py-1.5 text-sm">
                                    {filteredRows.length} filtered
                                </Badge>
                            )}
                        </div>

                        {/* Search */}
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search schools..."
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
                                            <TableHead className="h-14 px-6 text-sm font-semibold text-foreground/90">School Name</TableHead>
                                            <TableHead className="h-14 w-32 px-6 text-right text-sm font-semibold text-foreground/90">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {filteredRows.map((row, index) => (
                                            <SchoolRowTemplate key={row.id} row={row} index={index} />
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Enhanced Empty states */}
                                {filteredRows.length === 0 && (
                                    <div className="flex flex-col items-center justify-center px-6 py-20">
                                        {searchQuery ? (
                                            <>
                                                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50">
                                                    <Search className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                                <h3 className="mb-2 text-xl font-semibold text-foreground">No schools found</h3>
                                                <p className="mb-6 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
                                                    No schools match your search for "{searchQuery}". Try adjusting your search terms or check the
                                                    spelling.
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
                                                    <GraduationCap className="h-8 w-8 text-primary" />
                                                </div>
                                                <h3 className="mb-2 text-xl font-semibold text-foreground">No schools yet</h3>
                                                <p className="mb-8 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
                                                    Get started by adding your first school or higher education institution to the system.
                                                </p>
                                                <Button onClick={() => setOpenCreate(true)} size="default" className="transition-all duration-200">
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Add Your First School
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
