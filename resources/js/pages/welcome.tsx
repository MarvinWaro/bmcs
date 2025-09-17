import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Footer from '@/components/welcome-footer';
import { useAppearance } from '@/hooks/use-appearance';
import { dashboard } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { CalendarIcon, CheckCircle, FileText, LoaderCircle, MessageCircle, Monitor, Moon, Star, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';

function formatDate(date: Date | undefined) {
    if (!date) {
        return '';
    }
    return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}

function isValidDate(date: Date | undefined) {
    if (!date) {
        return false;
    }
    return !isNaN(date.getTime());
}

// Add School type
type School = {
    id: string;
    name: string;
};

interface PageProps extends SharedData {
    errors: Record<string, string>;
    schools: School[]; // Add schools prop
}

export default function Welcome() {
    const { auth, errors, schools } = usePage<PageProps>().props; // Get schools from props
    const { appearance, updateAppearance } = useAppearance();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        transactionDate: '',
        firstName: '',
        middleName: '',
        lastName: '',
        schoolHEI: '',
        otherSchoolSpecify: '',
        transactionType: '',
        otherTransactionSpecify: '',
        email: '',
        satisfactionRating: '',
        reason: '',
    });

    // Function to cycle through themes
    const toggleTheme = () => {
        switch (appearance) {
            case 'light':
                updateAppearance('dark');
                break;
            case 'dark':
                updateAppearance('system');
                break;
            case 'system':
                updateAppearance('light');
                break;
            default:
                updateAppearance('dark');
        }
    };

    // Get current icon and tooltip text based on appearance
    const getThemeIcon = () => {
        switch (appearance) {
            case 'light':
                return { icon: Sun, tooltip: 'Switch to Dark Mode' };
            case 'dark':
                return { icon: Moon, tooltip: 'Switch to System Mode' };
            case 'system':
                return { icon: Monitor, tooltip: 'Switch to Light Mode' };
            default:
                return { icon: Sun, tooltip: 'Toggle theme' };
        }
    };

    const { icon: ThemeIcon, tooltip } = getThemeIcon();

    // Show validation errors as toast notifications
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            console.log('Showing toast errors:', errors);
            Object.entries(errors).forEach(([field, message]) => {
                if (field === 'general') {
                    toast.error(message);
                } else {
                    const fieldLabels: Record<string, string> = {
                        transaction_date: 'Transaction Date',
                        first_name: 'First Name',
                        middle_name: 'Middle Name',
                        last_name: 'Last Name',
                        email: 'Email Address',
                        school_hei: 'School/HEI',
                        other_school_specify: 'School Specification',
                        transaction_type: 'Transaction Type',
                        other_transaction_specify: 'Transaction Specification',
                        satisfaction_rating: 'Satisfaction Rating',
                        reason: 'Feedback',
                    };

                    const fieldLabel = fieldLabels[field] || field;
                    toast.error(`${fieldLabel}: ${message}`);
                }
            });
        }
    }, [errors]);

    // Date picker states
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [month, setMonth] = useState<Date | undefined>(new Date());
    const [dateValue, setDateValue] = useState('');

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleRatingSelect = (rating: string) => {
        setFormData((prev) => ({
            ...prev,
            satisfactionRating: rating,
        }));
        setCurrentStep(3);
    };

    const handleDateChange = (date: Date | undefined) => {
        setSelectedDate(date);
        const formattedDate = date ? date.toISOString().split('T')[0] : '';
        setDateValue(formatDate(date));
        handleInputChange('transactionDate', formattedDate);
    };

    const handleDateInputChange = (inputValue: string) => {
        setDateValue(inputValue);
        const date = new Date(inputValue);
        if (isValidDate(date)) {
            setSelectedDate(date);
            setMonth(date);
            handleInputChange('transactionDate', date.toISOString().split('T')[0]);
        }
    };

    const handleSubmit = () => {
        setIsSubmitting(true);

        const submitData = {
            transaction_date: formData.transactionDate,
            first_name: formData.firstName,
            middle_name: formData.middleName,
            last_name: formData.lastName,
            email: formData.email,
            school_hei: formData.schoolHEI,
            other_school_specify: formData.otherSchoolSpecify,
            transaction_type: formData.transactionType,
            other_transaction_specify: formData.otherTransactionSpecify,
            satisfaction_rating: formData.satisfactionRating,
            reason: formData.reason,
        };

        router.post('/client-satisfaction-survey', submitData, {
            onSuccess: () => {
                setCurrentStep(4);
                setIsSubmitting(false);
            },
            onError: (errors) => {
                console.error('Validation errors:', errors);
                setIsSubmitting(false);
            },
        });
    };

    const resetForm = () => {
        setFormData({
            transactionDate: '',
            firstName: '',
            middleName: '',
            lastName: '',
            schoolHEI: '',
            otherSchoolSpecify: '',
            transactionType: '',
            otherTransactionSpecify: '',
            email: '',
            satisfactionRating: '',
            reason: '',
        });
        setSelectedDate(undefined);
        setDateValue('');
        setMonth(new Date());
        setIsSubmitting(false);
        setCurrentStep(1);
    };

    const ratings = [
        {
            id: 'dissatisfied',
            label: 'Dissatisfied',
            icon: '😞',
            className:
                'hover:bg-red-50 border-red-200 hover:border-red-300 text-red-600 dark:hover:bg-red-900/20 dark:border-red-800 dark:hover:border-red-700 dark:text-red-400',
        },
        {
            id: 'neutral',
            label: 'Neutral',
            icon: '😐',
            className:
                'hover:bg-yellow-50 border-yellow-200 hover:border-yellow-300 text-yellow-600 dark:hover:bg-yellow-900/20 dark:border-yellow-800 dark:hover:border-yellow-700 dark:text-yellow-400',
        },
        {
            id: 'satisfied',
            label: 'Satisfied',
            icon: '😊',
            className:
                'hover:bg-green-50 border-green-200 hover:border-green-300 text-green-600 dark:hover:bg-green-900/20 dark:border-green-800 dark:hover:border-green-700 dark:text-green-400',
        },
    ];

    const getReasonPrompt = () => {
        switch (formData.satisfactionRating) {
            case 'satisfied':
                return 'What made you satisfied with our service?';
            case 'dissatisfied':
                return 'What made you dissatisfied with our service?';
            case 'neutral':
                return 'What could we have done better to improve your experience?';
            default:
                return 'Please share your feedback:';
        }
    };

    const canProceedToRating = () => {
        const hasBasicInfo =
            formData.transactionDate && formData.firstName && formData.lastName && formData.email && formData.schoolHEI && formData.transactionType;

        // Check for "other" cases
        let schoolValid = true;
        let transactionValid = true;

        // If school is "other", check if specification is provided
        if (formData.schoolHEI === 'other') {
            schoolValid = formData.otherSchoolSpecify.trim().length > 0;
        }

        // If transaction type is "other", check if specification is provided
        if (formData.transactionType === 'other') {
            transactionValid = formData.otherTransactionSpecify.trim().length > 0;
        }

        return hasBasicInfo && schoolValid && transactionValid;
    };

    // Get selected school name for display
    const getSelectedSchoolName = () => {
        if (!formData.schoolHEI) return '';
        if (formData.schoolHEI === 'other') {
            return formData.otherSchoolSpecify || 'Other (Not Specified)';
        }

        const selectedSchool = schools.find((school) => school.id === formData.schoolHEI);
        return selectedSchool ? selectedSchool.name : formData.schoolHEI;
    };

    // Get full name for display
    const getFullName = () => {
        const parts = [formData.firstName, formData.middleName, formData.lastName].filter(Boolean);
        return parts.join(' ');
    };

    const progressPercentage = (currentStep / 4) * 100;

    return (
        <>
            <Head title="Client Satisfaction Survey">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div className="flex min-h-screen flex-col bg-[#FDFDFC] text-[#1b1b18] dark:bg-[#0a0a0a] dark:text-[#EDEDEC]">
                <header className="sticky top-0 z-50 mb-6 w-full border-b border-[#19140035]/20 bg-[#FDFDFC]/80 px-6 py-4 text-sm shadow-sm backdrop-blur-sm dark:border-[#3E3E3A]/30 dark:bg-[#0a0a0a]/80">
                    <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-3">
                                <img src="/assets/img/unifast.png" alt="UNIFAST Logo" className="h-12 w-auto object-contain" />
                                <img src="/assets/img/ched-logo.png" alt="CHED Logo" className="h-13 w-auto object-contain" />
                                <div className="text-lg font-semibold text-[#1b1b18] dark:text-[#EDEDEC]">UniFAST BARMM</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-[#1b1b18] transition-colors hover:bg-[#19140035] dark:text-[#EDEDEC] dark:hover:bg-[#3E3E3A]"
                                            onClick={toggleTheme}
                                        >
                                            <ThemeIcon className="h-4 w-4" />
                                            <span className="sr-only">Toggle theme</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{tooltip}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            {auth.user && (
                                <Link
                                    href={dashboard()}
                                    className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                                >
                                    Dashboard
                                </Link>
                            )}
                        </div>
                    </nav>
                </header>

                <div className="flex flex-1 items-center justify-center p-6 lg:p-8">
                    <main className="flex w-full max-w-[600px] flex-col items-center">
                        <Card className="w-full">
                            <CardHeader>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h1 className="text-2xl font-semibold">Client Satisfaction Survey</h1>
                                        <Badge variant="outline">Step {currentStep} of 4</Badge>
                                    </div>

                                    <div className="relative flex items-center justify-between">
                                        <div className="relative z-10 flex flex-col items-center space-y-2">
                                            <div
                                                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                                    currentStep >= 1
                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                        : 'border-muted-foreground bg-background text-muted-foreground'
                                                }`}
                                            >
                                                {currentStep > 1 ? <CheckCircle className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                                            </div>
                                            <div className="flex min-h-[32px] flex-col justify-center text-center text-xs font-medium">
                                                <div className={currentStep === 1 ? 'text-primary' : 'text-muted-foreground'}>Transaction</div>
                                                <div className={currentStep === 1 ? 'text-primary' : 'text-muted-foreground'}>Information</div>
                                            </div>
                                        </div>

                                        <div className="relative z-10 flex flex-col items-center space-y-2">
                                            <div
                                                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                                    currentStep >= 2
                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                        : 'border-muted-foreground bg-background text-muted-foreground'
                                                }`}
                                            >
                                                {currentStep > 2 ? <CheckCircle className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                                            </div>
                                            <div className="flex min-h-[32px] flex-col justify-center text-center text-xs font-medium">
                                                <div className={currentStep === 2 ? 'text-primary' : 'text-muted-foreground'}>Satisfaction</div>
                                                <div className={currentStep === 2 ? 'text-primary' : 'text-muted-foreground'}>Rating</div>
                                            </div>
                                        </div>

                                        <div className="relative z-10 flex flex-col items-center space-y-2">
                                            <div
                                                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                                    currentStep >= 3
                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                        : 'border-muted-foreground bg-background text-muted-foreground'
                                                }`}
                                            >
                                                {currentStep > 3 ? <CheckCircle className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
                                            </div>
                                            <div className="flex min-h-[32px] flex-col justify-center text-center text-xs font-medium">
                                                <div className={currentStep === 3 ? 'text-primary' : 'text-muted-foreground'}>Feedback</div>
                                                <div className={currentStep === 3 ? 'text-primary' : 'text-muted-foreground'}>Details</div>
                                            </div>
                                        </div>

                                        <div className="relative z-10 flex flex-col items-center space-y-2">
                                            <div
                                                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                                    currentStep >= 4
                                                        ? 'border-green-600 bg-green-600 text-white'
                                                        : 'border-muted-foreground bg-background text-muted-foreground'
                                                }`}
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                            </div>
                                            <div className="flex min-h-[32px] flex-col justify-center text-center text-xs font-medium">
                                                <div className={currentStep === 4 ? 'text-green-600' : 'text-muted-foreground'}>Complete</div>
                                            </div>
                                        </div>

                                        <div className="absolute top-5 right-0 left-0 -z-10 h-0.5 bg-muted-foreground/20">
                                            <div
                                                className="h-full bg-primary transition-all duration-500 ease-out"
                                                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <Progress value={progressPercentage} className="w-full" />

                                    <p className="text-center text-sm text-muted-foreground">
                                        {currentStep === 1
                                            ? 'Please provide the details of your transaction'
                                            : currentStep === 2
                                              ? 'Rate your satisfaction with our service'
                                              : currentStep === 3
                                                ? 'Share your detailed feedback with us'
                                                : 'Thank you for your valuable feedback!'}
                                    </p>
                                </div>
                            </CardHeader>

                            <CardContent>
                                {/* Step 1: Transaction Information */}
                                {currentStep === 1 && (
                                    <div className="space-y-6">
                                        <div>
                                            <CardTitle className="mb-3">Transaction Information</CardTitle>
                                            <p className="mb-6 text-muted-foreground">Please provide the details of your transaction</p>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Date Picker */}
                                            <div className="flex flex-col gap-3">
                                                <Label htmlFor="transactionDate" className="px-1">
                                                    Date of Transaction <span className="text-red-500">*</span>
                                                </Label>
                                                <div className="relative flex gap-2">
                                                    <Input
                                                        id="transactionDate"
                                                        value={dateValue}
                                                        placeholder="Select transaction date"
                                                        className="bg-background pr-10"
                                                        onChange={(e) => handleDateInputChange(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'ArrowDown') {
                                                                e.preventDefault();
                                                                setDatePickerOpen(true);
                                                            }
                                                        }}
                                                    />
                                                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                id="date-picker"
                                                                variant="ghost"
                                                                className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                                                            >
                                                                <CalendarIcon className="size-3.5" />
                                                                <span className="sr-only">Select date</span>
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent
                                                            className="w-auto min-w-[280px] overflow-hidden p-3 md:min-w-[320px] md:p-4"
                                                            align="end"
                                                            alignOffset={-8}
                                                            sideOffset={10}
                                                        >
                                                            <Calendar
                                                                mode="single"
                                                                selected={selectedDate}
                                                                captionLayout="dropdown"
                                                                month={month}
                                                                onMonthChange={setMonth}
                                                                onSelect={(date) => {
                                                                    handleDateChange(date);
                                                                    setDatePickerOpen(false);
                                                                }}
                                                                disabled={(date) => {
                                                                    const today = new Date();
                                                                    today.setHours(23, 59, 59, 999);
                                                                    return date > today;
                                                                }}
                                                                className="w-full"
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                            </div>

                                            {/* Updated Name Fields */}
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                <div className="space-y-2">
                                                    <Label htmlFor="firstName">
                                                        First Name <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        id="firstName"
                                                        type="text"
                                                        value={formData.firstName}
                                                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                                                        placeholder="Enter first name"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="middleName">Middle Name</Label>
                                                    <Input
                                                        id="middleName"
                                                        type="text"
                                                        value={formData.middleName}
                                                        onChange={(e) => handleInputChange('middleName', e.target.value)}
                                                        placeholder="Enter middle name"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="lastName">
                                                        Last Name <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        id="lastName"
                                                        type="text"
                                                        value={formData.lastName}
                                                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                                                        placeholder="Enter last name"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="email">
                                                    Email Address <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                                    placeholder="Enter your email address"
                                                />
                                            </div>

                                            {/* Updated School/HEI field - now a dropdown */}
                                            <div className="space-y-2">
                                                <Label htmlFor="schoolHEI">
                                                    School/HEI <span className="text-red-500">*</span>
                                                </Label>
                                                <Select
                                                    value={formData.schoolHEI}
                                                    onValueChange={(value) => {
                                                        handleInputChange('schoolHEI', value);
                                                        // Clear the other school specification when changing school
                                                        if (value !== 'other') {
                                                            handleInputChange('otherSchoolSpecify', '');
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger id="schoolHEI">
                                                        <SelectValue placeholder="Select your school or institution" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {schools.map((school) => (
                                                            <SelectItem key={school.id} value={school.id}>
                                                                {school.name}
                                                            </SelectItem>
                                                        ))}
                                                        {/* Option for schools not in the list */}
                                                        <SelectItem value="other">Other (Not Listed)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Show manual input if "Other" is selected */}
                                            {formData.schoolHEI === 'other' && (
                                                <div className="space-y-2 duration-200 animate-in slide-in-from-top-2">
                                                    <Label htmlFor="otherSchoolSpecify">
                                                        Please specify your school/institution <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        id="otherSchoolSpecify"
                                                        type="text"
                                                        value={formData.otherSchoolSpecify}
                                                        onChange={(e) => handleInputChange('otherSchoolSpecify', e.target.value)}
                                                        placeholder="Enter your school or higher education institution"
                                                        className="bg-background"
                                                    />
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <Label htmlFor="transactionType">
                                                    Type of Transaction <span className="text-red-500">*</span>
                                                </Label>
                                                <Select
                                                    value={formData.transactionType}
                                                    onValueChange={(value) => {
                                                        handleInputChange('transactionType', value);
                                                        if (value !== 'other') {
                                                            handleInputChange('otherTransactionSpecify', '');
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger id="transactionType">
                                                        <SelectValue placeholder="Select transaction type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="enrollment">Enrollment</SelectItem>
                                                        <SelectItem value="payment">Payment</SelectItem>
                                                        <SelectItem value="transcript">Transcript Request</SelectItem>
                                                        <SelectItem value="certification">Certification</SelectItem>
                                                        <SelectItem value="scholarship">Scholarship Application</SelectItem>
                                                        <SelectItem value="consultation">Consultation</SelectItem>
                                                        <SelectItem value="other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {formData.transactionType === 'other' && (
                                                <div className="space-y-2 duration-200 animate-in slide-in-from-top-2">
                                                    <Label htmlFor="otherTransactionSpecify">
                                                        Please specify the transaction type <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        id="otherTransactionSpecify"
                                                        type="text"
                                                        value={formData.otherTransactionSpecify}
                                                        onChange={(e) => handleInputChange('otherTransactionSpecify', e.target.value)}
                                                        placeholder="Please describe the type of transaction"
                                                        className="bg-background"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-end">
                                            <Button onClick={() => setCurrentStep(2)} disabled={!canProceedToRating()}>
                                                Continue to Rating
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Satisfaction Rating */}
                                {currentStep === 2 && (
                                    <div className="space-y-6">
                                        <div>
                                            <CardTitle className="mb-3">Rate Your Satisfaction</CardTitle>
                                            <p className="mb-6 text-muted-foreground">How satisfied are you with our service?</p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            {ratings.map((rating) => (
                                                <Button
                                                    key={rating.id}
                                                    variant="outline"
                                                    onClick={() => handleRatingSelect(rating.id)}
                                                    className={`h-24 flex-col space-y-2 transition-all duration-300 hover:scale-105 ${rating.className}`}
                                                >
                                                    <div className="text-3xl">{rating.icon}</div>
                                                    <span className="text-sm font-medium">{rating.label}</span>
                                                </Button>
                                            ))}
                                        </div>

                                        <div className="flex justify-start">
                                            <Button variant="outline" onClick={() => setCurrentStep(1)}>
                                                Back
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Reason/Feedback */}
                                {currentStep === 3 && (
                                    <div className="space-y-6">
                                        <div>
                                            <CardTitle className="mb-3">Tell Us More</CardTitle>
                                            <p className="mb-6 text-muted-foreground">{getReasonPrompt()}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="reason">
                                                Your Feedback <span className="text-red-500">*</span>
                                            </Label>
                                            <textarea
                                                id="reason"
                                                value={formData.reason}
                                                onChange={(e) => handleInputChange('reason', e.target.value)}
                                                placeholder="Please share your detailed feedback..."
                                                rows={5}
                                                className="flex min-h-[80px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                        </div>

                                        <div className="flex justify-between">
                                            <Button variant="outline" onClick={() => setCurrentStep(2)}>
                                                Back
                                            </Button>
                                            <Button
                                                onClick={handleSubmit}
                                                disabled={!formData.reason.trim() || isSubmitting}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 4: Thank You */}
                                {currentStep === 4 && (
                                    <div className="space-y-6 text-center">
                                        <div className="mb-4 text-6xl">✅</div>
                                        <div>
                                            <CardTitle className="mb-3">Thank you for your feedback!</CardTitle>
                                            <p className="mb-6 text-muted-foreground">
                                                Your response has been recorded and will help us improve our services.
                                            </p>
                                        </div>

                                        <Card className="text-left">
                                            <CardHeader>
                                                <CardTitle className="text-lg">Feedback Summary</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="font-medium">Client:</span>
                                                        <span>{getFullName()}</span>
                                                    </div>
                                                    {formData.email && (
                                                        <div className="flex justify-between">
                                                            <span className="font-medium">Email:</span>
                                                            <span>{formData.email}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between">
                                                        <span className="font-medium">Institution:</span>
                                                        <span>{getSelectedSchoolName()}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="font-medium">Transaction:</span>
                                                        <span className="text-right capitalize">
                                                            {formData.transactionType === 'other' && formData.otherTransactionSpecify
                                                                ? `Other: ${formData.otherTransactionSpecify}`
                                                                : formData.transactionType}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="font-medium">Date:</span>
                                                        <span>{formData.transactionDate}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="font-medium">Rating:</span>
                                                        <Badge
                                                            variant={
                                                                formData.satisfactionRating === 'satisfied'
                                                                    ? 'default'
                                                                    : formData.satisfactionRating === 'dissatisfied'
                                                                      ? 'destructive'
                                                                      : 'secondary'
                                                            }
                                                        >
                                                            {formData.satisfactionRating}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Button variant="outline" onClick={resetForm}>
                                            Submit Another Response
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </main>
                </div>

                <Footer />
            </div>

            <Toaster
                position="top-right"
                expand={true}
                richColors
                toastOptions={{
                    classNames: {
                        toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
                        description: 'group-[.toast]:text-muted-foreground',
                        actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
                        cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
                    },
                }}
            />
        </>
    );
}
