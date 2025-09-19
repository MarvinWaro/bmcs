import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import * as React from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    LineChart,
    Line
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    Users,
    Star,
    ThumbsUp,
    ThumbsDown,
    Calendar,
    School,
    FileText,
    Filter,
    Eye
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

// Grayscale color palette for UI elements
const GRAYSCALE_COLORS = {
    primary: '#374151',      // gray-700
    secondary: '#6B7280',    // gray-500
    tertiary: '#9CA3AF',     // gray-400
    light: '#D1D5DB',        // gray-300
    lighter: '#E5E7EB',      // gray-200
    lightest: '#F3F4F6',     // gray-100
    dark: '#1F2937',         // gray-800
    darker: '#111827',       // gray-900
};

// Colorful palette for chart data
const CHART_COLORS = {
    satisfied: '#10B981',       // emerald-500 (green)
    dissatisfied: '#EF4444',   // red-500
    primary: '#3B82F6',        // blue-500
    secondary: '#8B5CF6',      // violet-500
    accent: '#F59E0B',         // amber-500
    success: '#10B981',        // emerald-500
    warning: '#F59E0B',        // amber-500
    danger: '#EF4444',         // red-500
    info: '#06B6D4',           // cyan-500
    purple: '#8B5CF6',         // violet-500
    pink: '#EC4899',           // pink-500
    indigo: '#6366F1',         // indigo-500
    teal: '#14B8A6',           // teal-500
    orange: '#F97316',         // orange-500
    lime: '#84CC16',           // lime-500
};

// Vibrant colors for pie chart
const PIE_COLORS = [
    CHART_COLORS.primary,      // blue
    CHART_COLORS.secondary,    // violet
    CHART_COLORS.success,      // emerald
    CHART_COLORS.warning,      // amber
    CHART_COLORS.danger,       // red
    CHART_COLORS.info,         // cyan
    CHART_COLORS.purple,       // violet
    CHART_COLORS.pink,         // pink
    CHART_COLORS.indigo,       // indigo
    CHART_COLORS.teal,         // teal
    CHART_COLORS.orange,       // orange
    CHART_COLORS.lime,         // lime
];

type Analytics = {
    metrics: {
        total_surveys: number;
        satisfied_count: number;
        dissatisfied_count: number;
        satisfaction_rate: number;
        total_change: number;
        satisfaction_change: number;
    };
    daily_trend: Array<{
        date: string;
        satisfied: number;
        dissatisfied: number;
        total: number;
    }>;
    monthly_trend: Array<{
        month: string;
        satisfied: number;
        dissatisfied: number;
        total: number;
        satisfaction_rate: number;
    }>;
    school_distribution: Array<{
        name: string;
        value: number;
        satisfied: number;
        dissatisfied: number;
    }>;
    transaction_distribution: Array<{
        name: string;
        value: number;
        satisfied: number;
        dissatisfied: number;
    }>;
    recent_surveys: Array<{
        id: string;
        client_name: string;
        satisfaction_rating: string;
        school: string;
        transaction_type: string;
        date: string;
        submitted_at: string;
    }>;
};

type FilterOptions = {
    schools: Array<{ id: string; name: string }>;
    transaction_types: Array<{ value: string; label: string }>;
    date_ranges: Array<{ value: string; label: string }>;
};

type CurrentFilters = {
    date_range: string;
    school?: string;
    transaction_type?: string;
};

type PageProps = {
    analytics: Analytics;
    filter_options: FilterOptions;
    current_filters: CurrentFilters;
};

export default function Dashboard() {
    const { props } = usePage<PageProps>();
    const { analytics, filter_options, current_filters } = props;

    // State for chart time range filters
    const [dailyTimeRange, setDailyTimeRange] = React.useState("30d");
    const [monthlyTimeRange, setMonthlyTimeRange] = React.useState("6m");

    const updateFilters = (newFilters: Partial<CurrentFilters>) => {
        const filters = { ...current_filters, ...newFilters };

        // Remove empty filters
        Object.keys(filters).forEach(key => {
            const filterKey = key as keyof CurrentFilters;
            if (!filters[filterKey] || filters[filterKey] === 'all') {
                delete filters[filterKey];
            }
        });

        router.get('/dashboard', filters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Get top 10 schools by transaction count
    const top10Schools = analytics.school_distribution
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

    // Filter daily trend data based on time range
    const getFilteredDailyData = (timeRange: string) => {
        if (!analytics.daily_trend || analytics.daily_trend.length === 0) return [];

        const sortedData = analytics.daily_trend.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const latestDate = new Date(sortedData[sortedData.length - 1].date);

        let daysToInclude = 30;
        if (timeRange === "7d") daysToInclude = 7;
        else if (timeRange === "14d") daysToInclude = 14;
        else if (timeRange === "90d") daysToInclude = 90;

        const cutoffDate = new Date(latestDate);
        cutoffDate.setDate(cutoffDate.getDate() - daysToInclude);

        return sortedData.filter(item => new Date(item.date) >= cutoffDate);
    };

    // Filter monthly trend data based on time range
    const getFilteredMonthlyData = (timeRange: string) => {
        if (!analytics.monthly_trend || analytics.monthly_trend.length === 0) return [];

        let monthsToInclude = 6;
        if (timeRange === "3m") monthsToInclude = 3;
        else if (timeRange === "12m") monthsToInclude = 12;

        return analytics.monthly_trend.slice(-monthsToInclude);
    };

    const filteredDailyData = getFilteredDailyData(dailyTimeRange);
    const filteredMonthlyData = getFilteredMonthlyData(monthlyTimeRange);

    // Custom tooltip for charts
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-lg border border-border bg-background p-3 shadow-md">
                    <p className="text-sm font-medium">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {`${entry.dataKey}: ${entry.value}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Custom tooltip for pie chart
    const PieTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="rounded-lg border border-border bg-background p-3 shadow-md">
                    <p className="text-sm font-medium">{data.name}</p>
                    <p className="text-sm">Responses: {data.value}</p>
                    <p className="text-sm" style={{ color: CHART_COLORS.satisfied }}>
                        Satisfied: {data.satisfied}
                    </p>
                    <p className="text-sm" style={{ color: CHART_COLORS.dissatisfied }}>
                        Dissatisfied: {data.dissatisfied}
                    </p>
                </div>
            );
        }
        return null;
    };

    // Format percentage change for display
    const formatChange = (change: number) => {
        const icon = change >= 0 ? TrendingUp : TrendingDown;
        const IconComponent = icon;
        const color = change >= 0 ? 'text-green-600' : 'text-red-600';

        return (
            <div className={`flex items-center gap-1 text-xs ${color}`}>
                <IconComponent className="h-3 w-3" />
                {Math.abs(change)}%
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 mb-7">

                {/* Filters Section */}
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <CardTitle className="text-base">Analytics Filters</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Date Range</label>
                                <Select
                                    value={current_filters.date_range || 'last_30_days'}
                                    onValueChange={(value) => updateFilters({ date_range: value })}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filter_options.date_ranges.map((range) => (
                                            <SelectItem key={range.value} value={range.value}>
                                                {range.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">School</label>
                                <Select
                                    value={current_filters.school || 'all'}
                                    onValueChange={(value) => updateFilters({ school: value })}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Schools</SelectItem>
                                        {filter_options.schools.map((school) => (
                                            <SelectItem key={school.id} value={school.name}>
                                                {school.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Transaction Type</label>
                                <Select
                                    value={current_filters.transaction_type || 'all'}
                                    onValueChange={(value) => updateFilters({ transaction_type: value })}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        {filter_options.transaction_types.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Key Metrics Cards */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Surveys</CardTitle>
                            <Users className="h-4 w-4" style={{ color: GRAYSCALE_COLORS.secondary }} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analytics.metrics.total_surveys}</div>
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">vs previous period</p>
                                {formatChange(analytics.metrics.total_change)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Satisfaction Rate</CardTitle>
                            <Star className="h-4 w-4" style={{ color: GRAYSCALE_COLORS.secondary }} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analytics.metrics.satisfaction_rate}%</div>
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">change from previous</p>
                                {formatChange(analytics.metrics.satisfaction_change)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Satisfied Clients</CardTitle>
                            <ThumbsUp className="h-4 w-4" style={{ color: GRAYSCALE_COLORS.secondary }} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analytics.metrics.satisfied_count}</div>
                            <p className="text-xs text-muted-foreground">
                                {analytics.metrics.total_surveys > 0
                                    ? Math.round((analytics.metrics.satisfied_count / analytics.metrics.total_surveys) * 100)
                                    : 0}% of total responses
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Dissatisfied Clients</CardTitle>
                            <ThumbsDown className="h-4 w-4" style={{ color: GRAYSCALE_COLORS.secondary }} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analytics.metrics.dissatisfied_count}</div>
                            <p className="text-xs text-muted-foreground">
                                {analytics.metrics.total_surveys > 0
                                    ? Math.round((analytics.metrics.dissatisfied_count / analytics.metrics.total_surveys) * 100)
                                    : 0}% of total responses
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Full Width Area Chart */}
                <Card>
                    <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                        <div className="grid flex-1 gap-1">
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Daily Satisfaction Trend
                            </CardTitle>
                            <CardDescription>
                                Showing satisfaction responses over the selected period
                            </CardDescription>
                        </div>
                        <Select value={dailyTimeRange} onValueChange={setDailyTimeRange}>
                            <SelectTrigger
                                className="w-[160px] rounded-lg sm:ml-auto"
                                aria-label="Select time range"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="7d" className="rounded-lg">
                                    Last 7 days
                                </SelectItem>
                                <SelectItem value="14d" className="rounded-lg">
                                    Last 14 days
                                </SelectItem>
                                <SelectItem value="30d" className="rounded-lg">
                                    Last 30 days
                                </SelectItem>
                                <SelectItem value="90d" className="rounded-lg">
                                    Last 90 days
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                        <ResponsiveContainer width="100%" height={400}>
                            <AreaChart data={filteredDailyData}>
                                <defs>
                                    <linearGradient id="fillSatisfied" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={CHART_COLORS.satisfied} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={CHART_COLORS.satisfied} stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="fillDissatisfied" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={CHART_COLORS.dissatisfied} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={CHART_COLORS.dissatisfied} stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} stroke={GRAYSCALE_COLORS.lighter} />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    minTickGap={32}
                                    tickFormatter={(value: string) => {
                                        const date = new Date(value);
                                        return date.toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                        });
                                    }}
                                    stroke={GRAYSCALE_COLORS.secondary}
                                />
                                <YAxis stroke={GRAYSCALE_COLORS.secondary} />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="rounded-lg border border-border bg-background p-3 shadow-md">
                                                    <p className="text-sm font-medium">
                                                        {new Date(label).toLocaleDateString("en-US", {
                                                            month: "short",
                                                            day: "numeric",
                                                            year: "numeric",
                                                        })}
                                                    </p>
                                                    {payload.map((entry: any, index: number) => (
                                                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                                                            {`${entry.dataKey}: ${entry.value}`}
                                                        </p>
                                                    ))}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area
                                    dataKey="satisfied"
                                    type="natural"
                                    fill="url(#fillSatisfied)"
                                    stroke={CHART_COLORS.satisfied}
                                    strokeWidth={2}
                                    fillOpacity={0.6}
                                />
                                <Area
                                    dataKey="dissatisfied"
                                    type="natural"
                                    fill="url(#fillDissatisfied)"
                                    stroke={CHART_COLORS.dissatisfied}
                                    strokeWidth={2}
                                    fillOpacity={0.6}
                                />
                                <Legend />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Monthly Satisfaction Rate Chart */}
                <Card>
                    <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                        <div className="grid flex-1 gap-1">
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Monthly Satisfaction Rate
                            </CardTitle>
                            <CardDescription>
                                Satisfaction percentage trend over the selected period
                            </CardDescription>
                        </div>
                        <Select value={monthlyTimeRange} onValueChange={setMonthlyTimeRange}>
                            <SelectTrigger
                                className="w-[160px] rounded-lg sm:ml-auto"
                                aria-label="Select time range"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="3m" className="rounded-lg">
                                    Last 3 months
                                </SelectItem>
                                <SelectItem value="6m" className="rounded-lg">
                                    Last 6 months
                                </SelectItem>
                                <SelectItem value="12m" className="rounded-lg">
                                    Last 12 months
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={filteredMonthlyData}>
                                <CartesianGrid vertical={false} stroke={GRAYSCALE_COLORS.lighter} />
                                <XAxis
                                    dataKey="month"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    stroke={GRAYSCALE_COLORS.secondary}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[0, 100]}
                                    stroke={GRAYSCALE_COLORS.secondary}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="satisfaction_rate"
                                    stroke={CHART_COLORS.primary}
                                    strokeWidth={3}
                                    dot={{ fill: CHART_COLORS.primary, strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, stroke: CHART_COLORS.primary, strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Charts Row: Donut Chart and Transaction Distribution */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Top 10 Schools Donut Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <School className="h-4 w-4" />
                                Top 10 Schools Distribution
                            </CardTitle>
                            <CardDescription>
                                Survey responses by top 10 schools/institutions
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 pb-0">
                            <ResponsiveContainer width="100%" height={350}>
                                <PieChart>
                                    <Pie
                                        data={top10Schools}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={120}
                                        paddingAngle={2}
                                        label={({ name, value }) => `${name}: ${value}`}
                                    >
                                        {top10Schools.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<PieTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Transaction Type Distribution Bar Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Transaction Types
                            </CardTitle>
                            <CardDescription>
                                Survey responses by transaction type
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={analytics.transaction_distribution}>
                                    <CartesianGrid vertical={false} stroke={GRAYSCALE_COLORS.lighter} />
                                    <XAxis
                                        dataKey="name"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                        fontSize={12}
                                        stroke={GRAYSCALE_COLORS.secondary}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        stroke={GRAYSCALE_COLORS.secondary}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar
                                        dataKey="satisfied"
                                        stackId="a"
                                        fill={CHART_COLORS.satisfied}
                                        name="Satisfied"
                                    />
                                    <Bar
                                        dataKey="dissatisfied"
                                        stackId="a"
                                        fill={CHART_COLORS.dissatisfied}
                                        name="Dissatisfied"
                                    />
                                    <Legend />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Surveys Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Recent Survey Responses
                        </CardTitle>
                        <CardDescription>
                            Latest client satisfaction survey submissions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Satisfaction</TableHead>
                                    <TableHead>School</TableHead>
                                    <TableHead>Transaction Type</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Submitted</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {analytics.recent_surveys.map((survey) => (
                                    <TableRow key={survey.id}>
                                        <TableCell className="font-medium">{survey.client_name}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={survey.satisfaction_rating === 'satisfied' ? 'default' : 'secondary'}
                                                className="text-xs"
                                            >
                                                {survey.satisfaction_rating === 'satisfied' ? 'Satisfied' : 'Dissatisfied'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {survey.school}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {survey.transaction_type}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {survey.date}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {survey.submitted_at}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
