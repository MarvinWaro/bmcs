import { dashboard } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { CalendarIcon, LoaderCircle, Sun, Moon, Monitor, FileText, Star, MessageCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppearance } from '@/hooks/use-appearance';
import { toast, Toaster } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import Footer from '@/components/welcome-footer'; // Add this import

function formatDate(date: Date | undefined) {
    if (!date) {
        return "";
    }
    return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

function isValidDate(date: Date | undefined) {
    if (!date) {
        return false;
    }
    return !isNaN(date.getTime());
}

interface PageProps extends SharedData {
    errors: Record<string, string>;
}

export default function Welcome() {
    const { auth, errors } = usePage<PageProps>().props;
    const { appearance, updateAppearance } = useAppearance();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        transactionDate: '',
        clientName: '',
        schoolHEI: '',
        transactionType: '',
        otherTransactionSpecify: '', // Add the new field
        email: '',
        satisfactionRating: '',
        reason: ''
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
            console.log('Showing toast errors:', errors); // Debug log
            Object.entries(errors).forEach(([field, message]) => {
                if (field === 'general') {
                    toast.error(message);
                } else {
                    // Map Laravel field names to user-friendly field names
                    const fieldLabels: Record<string, string> = {
                        'transaction_date': 'Transaction Date',
                        'client_name': 'Client Name',
                        'email': 'Email Address',
                        'school_hei': 'School/HEI',
                        'transaction_type': 'Transaction Type',
                        'other_transaction_specify': 'Transaction Specification',
                        'satisfaction_rating': 'Satisfaction Rating',
                        'reason': 'Feedback'
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
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleRatingSelect = (rating: string) => {
        setFormData(prev => ({
            ...prev,
            satisfactionRating: rating
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

        // Map form data to match Laravel controller expectations
        const submitData = {
            transaction_date: formData.transactionDate,
            client_name: formData.clientName,
            email: formData.email,
            school_hei: formData.schoolHEI,
            transaction_type: formData.transactionType,
            other_transaction_specify: formData.otherTransactionSpecify, // Add the new field
            satisfaction_rating: formData.satisfactionRating,
            reason: formData.reason
        };

        router.post('/client-satisfaction-survey', submitData, {
            onSuccess: () => {
                setCurrentStep(4);
                setIsSubmitting(false);
            },
            onError: (errors) => {
                console.error('Validation errors:', errors);
                setIsSubmitting(false);
                // Stay on current step to show errors
            }
        });
    };

    const resetForm = () => {
        setFormData({
            transactionDate: '',
            clientName: '',
            schoolHEI: '',
            transactionType: '',
            otherTransactionSpecify: '', // Add the new field
            email: '',
            satisfactionRating: '',
            reason: ''
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
            className: 'hover:bg-red-50 border-red-200 hover:border-red-300 text-red-600 dark:hover:bg-red-900/20 dark:border-red-800 dark:hover:border-red-700 dark:text-red-400'
        },
        {
            id: 'neutral',
            label: 'Neutral',
            icon: '😐',
            className: 'hover:bg-yellow-50 border-yellow-200 hover:border-yellow-300 text-yellow-600 dark:hover:bg-yellow-900/20 dark:border-yellow-800 dark:hover:border-yellow-700 dark:text-yellow-400'
        },
        {
            id: 'satisfied',
            label: 'Satisfied',
            icon: '😊',
            className: 'hover:bg-green-50 border-green-200 hover:border-green-300 text-green-600 dark:hover:bg-green-900/20 dark:border-green-800 dark:hover:border-green-700 dark:text-green-400'
        }
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
        const hasBasicInfo = formData.transactionDate && formData.clientName && formData.email && formData.schoolHEI && formData.transactionType;

        // If transaction type is "other", also check if specification is provided
        if (formData.transactionType === 'other') {
            return hasBasicInfo && formData.otherTransactionSpecify.trim();
        }

        return hasBasicInfo;
    };

    const progressPercentage = (currentStep / 4) * 100;

    return (
        <>
            <Head title="Client Satisfaction Survey">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div className="flex min-h-screen flex-col bg-[#FDFDFC] text-[#1b1b18] dark:bg-[#0a0a0a] dark:text-[#EDEDEC]">
                <header className="w-full mb-6 px-6 text-sm bg-[#FDFDFC]/80 dark:bg-[#0a0a0a]/80 backdrop-blur-sm shadow-sm border-b border-[#19140035]/20 dark:border-[#3E3E3A]/30 sticky top-0 z-50 py-4">
                    <nav className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                        {/* Logos on the left */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-3">
                                <img
                                    src="/assets/img/unifast.png"
                                    alt="UNIFAST Logo"
                                    className="h-12 w-auto object-contain"
                                />
                                <img
                                    src="/assets/img/ched-logo.png"
                                    alt="CHED Logo"
                                    className="h-13 w-auto object-contain"
                                />
                                <div className="text-lg font-semibold text-[#1b1b18] dark:text-[#EDEDEC]">
                                    UniFAST BARMM
                                </div>
                            </div>
                        </div>

                        {/* Right side - Theme Toggle + Auth links */}
                        <div className="flex items-center gap-4">
                            {/* Theme Toggle */}
                            <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-[#1b1b18] hover:bg-[#19140035] transition-colors dark:text-[#EDEDEC] dark:hover:bg-[#3E3E3A]"
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

                            {/* Auth Links */}
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

                <div className="flex-1 flex items-center justify-center p-6 lg:p-8">
                    <main className="flex w-full max-w-[600px] flex-col items-center">
                        <Card className="w-full">
                            <CardHeader>
                                {/* Enhanced Progress Indicator */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h1 className="text-2xl font-semibold">Client Satisfaction Survey</h1>
                                        <Badge variant="outline">
                                            Step {currentStep} of 4
                                        </Badge>
                                    </div>

                                    {/* Interactive Stepper */}
                                    <div className="flex items-center justify-between relative">
                                        {/* Step 1 */}
                                        <div className="flex flex-col items-center space-y-2 relative z-10">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                                currentStep >= 1
                                                    ? 'bg-primary border-primary text-primary-foreground'
                                                    : 'bg-background border-muted-foreground text-muted-foreground'
                                            }`}>
                                                {currentStep > 1 ? (
                                                    <CheckCircle className="w-4 h-4" />
                                                ) : (
                                                    <FileText className="w-4 h-4" />
                                                )}
                                            </div>
                                            <div className="text-xs font-medium text-center min-h-[32px] flex flex-col justify-center">
                                                <div className={currentStep === 1 ? 'text-primary' : 'text-muted-foreground'}>
                                                    Transaction
                                                </div>
                                                <div className={currentStep === 1 ? 'text-primary' : 'text-muted-foreground'}>
                                                    Information
                                                </div>
                                            </div>
                                        </div>

                                        {/* Step 2 */}
                                        <div className="flex flex-col items-center space-y-2 relative z-10">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                                currentStep >= 2
                                                    ? 'bg-primary border-primary text-primary-foreground'
                                                    : 'bg-background border-muted-foreground text-muted-foreground'
                                            }`}>
                                                {currentStep > 2 ? (
                                                    <CheckCircle className="w-4 h-4" />
                                                ) : (
                                                    <Star className="w-4 h-4" />
                                                )}
                                            </div>
                                            <div className="text-xs font-medium text-center min-h-[32px] flex flex-col justify-center">
                                                <div className={currentStep === 2 ? 'text-primary' : 'text-muted-foreground'}>
                                                    Satisfaction
                                                </div>
                                                <div className={currentStep === 2 ? 'text-primary' : 'text-muted-foreground'}>
                                                    Rating
                                                </div>
                                            </div>
                                        </div>

                                        {/* Step 3 */}
                                        <div className="flex flex-col items-center space-y-2 relative z-10">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                                currentStep >= 3
                                                    ? 'bg-primary border-primary text-primary-foreground'
                                                    : 'bg-background border-muted-foreground text-muted-foreground'
                                            }`}>
                                                {currentStep > 3 ? (
                                                    <CheckCircle className="w-4 h-4" />
                                                ) : (
                                                    <MessageCircle className="w-4 h-4" />
                                                )}
                                            </div>
                                            <div className="text-xs font-medium text-center min-h-[32px] flex flex-col justify-center">
                                                <div className={currentStep === 3 ? 'text-primary' : 'text-muted-foreground'}>
                                                    Feedback
                                                </div>
                                                <div className={currentStep === 3 ? 'text-primary' : 'text-muted-foreground'}>
                                                    Details
                                                </div>
                                            </div>
                                        </div>

                                        {/* Step 4 */}
                                        <div className="flex flex-col items-center space-y-2 relative z-10">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                                currentStep >= 4
                                                    ? 'bg-green-600 border-green-600 text-white'
                                                    : 'bg-background border-muted-foreground text-muted-foreground'
                                            }`}>
                                                <CheckCircle className="w-4 h-4" />
                                            </div>
                                            <div className="text-xs font-medium text-center min-h-[32px] flex flex-col justify-center">
                                                <div className={currentStep === 4 ? 'text-green-600' : 'text-muted-foreground'}>
                                                    Complete
                                                </div>
                                            </div>
                                        </div>

                                        {/* Connection Lines */}
                                        <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted-foreground/20 -z-10">
                                            <div
                                                className="h-full bg-primary transition-all duration-500 ease-out"
                                                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <Progress value={progressPercentage} className="w-full" />

                                    {/* Step Description */}
                                    <p className="text-sm text-muted-foreground text-center">
                                        {currentStep === 1 ? 'Please provide the details of your transaction' :
                                         currentStep === 2 ? 'Rate your satisfaction with our service' :
                                         currentStep === 3 ? 'Share your detailed feedback with us' :
                                         'Thank you for your valuable feedback!'}
                                    </p>
                                </div>
                            </CardHeader>

                            <CardContent>
                                {/* Step 1: Transaction Information */}
                                {currentStep === 1 && (
                                    <div className="space-y-6">
                                        <div>
                                            <CardTitle className="mb-3">Transaction Information</CardTitle>
                                            <p className="text-muted-foreground mb-6">
                                                Please provide the details of your transaction
                                            </p>
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
                                                            if (e.key === "ArrowDown") {
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
                                                            className="w-auto min-w-[280px] md:min-w-[320px] overflow-hidden p-3 md:p-4"
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
                                                                    // Disable future dates (dates after today)
                                                                    const today = new Date();
                                                                    today.setHours(23, 59, 59, 999); // Set to end of today
                                                                    return date > today;
                                                                }}
                                                                className="w-full"
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="clientName">Client Name <span className="text-red-500">*</span></Label>
                                                <Input
                                                    id="clientName"
                                                    type="text"
                                                    value={formData.clientName}
                                                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                                                    placeholder="Enter your full name"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                                    placeholder="Enter your email address"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="schoolHEI">School/HEI <span className="text-red-500">*</span></Label>
                                                <Input
                                                    id="schoolHEI"
                                                    type="text"
                                                    value={formData.schoolHEI}
                                                    onChange={(e) => handleInputChange('schoolHEI', e.target.value)}
                                                    placeholder="Enter your school or higher education institution"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="transactionType">Type of Transaction <span className="text-red-500">*</span></Label>
                                                <Select
                                                    value={formData.transactionType}
                                                    onValueChange={(value) => {
                                                        handleInputChange('transactionType', value);
                                                        // Clear the other specification when changing transaction type
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

                                            {/* Conditional input for "Other" transaction type */}
                                            {formData.transactionType === 'other' && (
                                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                                    <Label htmlFor="otherTransactionSpecify">Please specify the transaction type <span className="text-red-500">*</span></Label>
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
                                            <Button
                                                onClick={() => setCurrentStep(2)}
                                                disabled={!canProceedToRating()}
                                            >
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
                                            <p className="text-muted-foreground mb-6">
                                                How satisfied are you with our service?
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {ratings.map((rating) => (
                                                <Button
                                                    key={rating.id}
                                                    variant="outline"
                                                    onClick={() => handleRatingSelect(rating.id)}
                                                    className={`h-24 flex-col space-y-2 transition-all duration-300 hover:scale-105 ${rating.className}`}
                                                >
                                                    <div className="text-3xl">{rating.icon}</div>
                                                    <span className="text-sm font-medium">
                                                        {rating.label}
                                                    </span>
                                                </Button>
                                            ))}
                                        </div>

                                        <div className="flex justify-start">
                                            <Button
                                                variant="outline"
                                                onClick={() => setCurrentStep(1)}
                                            >
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
                                            <p className="text-muted-foreground mb-6">
                                                {getReasonPrompt()}
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="reason">Your Feedback <span className="text-red-500">*</span></Label>
                                            <textarea
                                                id="reason"
                                                value={formData.reason}
                                                onChange={(e) => handleInputChange('reason', e.target.value)}
                                                placeholder="Please share your detailed feedback..."
                                                rows={5}
                                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                            />
                                        </div>

                                        <div className="flex justify-between">
                                            <Button
                                                variant="outline"
                                                onClick={() => setCurrentStep(2)}
                                            >
                                                Back
                                            </Button>
                                            <Button
                                                onClick={handleSubmit}
                                                disabled={!formData.reason.trim() || isSubmitting}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                {isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
                                                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 4: Thank You */}
                                {currentStep === 4 && (
                                    <div className="text-center space-y-6">
                                        <div className="text-6xl mb-4">✅</div>
                                        <div>
                                            <CardTitle className="mb-3">Thank you for your feedback!</CardTitle>
                                            <p className="text-muted-foreground mb-6">
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
                                                        <span>{formData.clientName}</span>
                                                    </div>
                                                    {formData.email && (
                                                        <div className="flex justify-between">
                                                            <span className="font-medium">Email:</span>
                                                            <span>{formData.email}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between">
                                                        <span className="font-medium">Institution:</span>
                                                        <span>{formData.schoolHEI}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="font-medium">Transaction:</span>
                                                        <span className="capitalize text-right">
                                                            {formData.transactionType === 'other' && formData.otherTransactionSpecify
                                                                ? `Other: ${formData.otherTransactionSpecify}`
                                                                : formData.transactionType
                                                            }
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
                                                                formData.satisfactionRating === 'satisfied' ? 'default' :
                                                                formData.satisfactionRating === 'dissatisfied' ? 'destructive' :
                                                                'secondary'
                                                            }
                                                        >
                                                            {formData.satisfactionRating}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Button
                                            variant="outline"
                                            onClick={resetForm}
                                        >
                                            Submit Another Response
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </main>
                </div>

                {/* Footer */}
                <Footer />
            </div>

            {/* Add Sonner Toaster with shadcn styling */}
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
