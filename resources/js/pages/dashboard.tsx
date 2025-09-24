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

// Enhanced color schemes
const GRAYSCALE_COLORS = {
    primary: '#374151',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    light: '#D1D5DB',
    lighter: '#E5E7EB',
    lightest: '#F3F4F6',
    dark: '#1F2937',
    darker: '#111827',
};

const CHART_COLORS = {
    satisfied: '#059669',
    dissatisfied: '#DC2626',
    primary: '#2563EB',
    secondary: '#7C3AED',
    accent: '#D97706',
    success: '#059669',
    warning: '#D97706',
    danger: '#DC2626',
    info: '#0891B2',
    purple: '#7C3AED',
    pink: '#DB2777',
    indigo: '#4F46E5',
    teal: '#0D9488',
    orange: '#EA580C',
    lime: '#65A30D',
};

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

    const [dailyTimeRange, setDailyTimeRange] = React.useState("30d");
    const [monthlyTimeRange, setMonthlyTimeRange] = React.useState("6m");

    const updateFilters = (newFilters: Partial<CurrentFilters>) => {
        const filters = { ...current_filters, ...newFilters };

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

    const getFilteredMonthlyData = (timeRange: string) => {
        if (!analytics.monthly_trend || analytics.monthly_trend.length === 0) return [];

        let monthsToInclude = 6;
        if (timeRange === "3m") monthsToInclude = 3;
        else if (timeRange === "12m") monthsToInclude = 12;

        return analytics.monthly_trend.slice(-monthsToInclude);
    };

    const filteredDailyData = getFilteredDailyData(dailyTimeRange);
    const filteredMonthlyData = getFilteredMonthlyData(monthlyTimeRange);

    // Enhanced custom tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-lg border border-border bg-background p-4 shadow-lg">
                    <p className="text-sm font-semibold mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="capitalize">{entry.dataKey}:</span>
                            <span className="font-medium">{entry.value}</span>
                        </div>
                    ))}
                    {payload.length === 2 && (
                        <div className="mt-2 pt-2 border-t border-border">
                            <div className="text-xs text-muted-foreground">
                                Total: {payload.reduce((sum: number, item: any) => sum + item.value, 0)}
                            </div>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    const formatChange = (change: number) => {
        const icon = change >= 0 ? TrendingUp : TrendingDown;
        const IconComponent = icon;
        const color = change >= 0 ? 'text-emerald-600' : 'text-red-600';

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

                {/* Enhanced Area Chart */}
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
                    <CardContent className="p-0">
                        <div className="p-6">
                            <ResponsiveContainer width="100%" height={450}>
                                <AreaChart
                                    data={filteredDailyData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                >
                                    <defs>
                                        <linearGradient id="fillSatisfied" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={CHART_COLORS.satisfied} stopOpacity={0.8} />
                                            <stop offset="95%" stopColor={CHART_COLORS.satisfied} stopOpacity={0.0} />
                                        </linearGradient>
                                        <linearGradient id="fillDissatisfied" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={CHART_COLORS.dissatisfied} stopOpacity={0.8} />
                                            <stop offset="95%" stopColor={CHART_COLORS.dissatisfied} stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke={GRAYSCALE_COLORS.lighter}
                                        horizontal={true}
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={10}
                                        minTickGap={32}
                                        tickFormatter={(value: string) => {
                                            const date = new Date(value);
                                            return date.toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                            });
                                        }}
                                        tick={{ fontSize: 12, fill: GRAYSCALE_COLORS.secondary }}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={10}
                                        tick={{ fontSize: 12, fill: GRAYSCALE_COLORS.secondary }}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        dataKey="satisfied"
                                        type="monotone"
                                        stackId="1"
                                        stroke={CHART_COLORS.satisfied}
                                        fill="url(#fillSatisfied)"
                                        strokeWidth={2}
                                        name="Satisfied"
                                        dot={false}
                                        activeDot={{ r: 6, stroke: CHART_COLORS.satisfied, strokeWidth: 2, fill: CHART_COLORS.satisfied }}
                                    />
                                    <Area
                                        dataKey="dissatisfied"
                                        type="monotone"
                                        stackId="1"
                                        stroke={CHART_COLORS.dissatisfied}
                                        fill="url(#fillDissatisfied)"
                                        strokeWidth={2}
                                        name="Dissatisfied"
                                        dot={false}
                                        activeDot={{ r: 6, stroke: CHART_COLORS.dissatisfied, strokeWidth: 2, fill: CHART_COLORS.dissatisfied }}
                                    />
                                    <Legend
                                        verticalAlign="top"
                                        height={36}
                                        iconType="circle"
                                        wrapperStyle={{ paddingBottom: '20px' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Enhanced Monthly Satisfaction Rate Chart */}
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
                    <CardContent className="p-0">
                        <div className="p-6">
                            <ResponsiveContainer width="100%" height={320}>
                                <LineChart
                                    data={filteredMonthlyData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke={GRAYSCALE_COLORS.lighter}
                                        horizontal={true}
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="month"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={10}
                                        tick={{ fontSize: 12, fill: GRAYSCALE_COLORS.secondary }}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        domain={[0, 100]}
                                        tickMargin={10}
                                        tick={{ fontSize: 12, fill: GRAYSCALE_COLORS.secondary }}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line
                                        type="monotone"
                                        dataKey="satisfaction_rate"
                                        stroke={CHART_COLORS.primary}
                                        strokeWidth={4}
                                        dot={{ fill: CHART_COLORS.primary, strokeWidth: 2, r: 5 }}
                                        activeDot={{ r: 7, stroke: CHART_COLORS.primary, strokeWidth: 3 }}
                                        name="Satisfaction Rate (%)"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Transaction Type Distribution - Full Width */}
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
                    <CardContent className="p-0">
                        <div className="p-6">
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart
                                    data={analytics.transaction_distribution}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke={GRAYSCALE_COLORS.lighter}
                                        horizontal={true}
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="name"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={10}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                        fontSize={11}
                                        tick={{ fill: GRAYSCALE_COLORS.secondary }}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={10}
                                        tick={{ fontSize: 12, fill: GRAYSCALE_COLORS.secondary }}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar
                                        dataKey="satisfied"
                                        stackId="a"
                                        fill={CHART_COLORS.satisfied}
                                        name="Satisfied"
                                        radius={[0, 0, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="dissatisfied"
                                        stackId="a"
                                        fill={CHART_COLORS.dissatisfied}
                                        name="Dissatisfied"
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <Legend
                                        verticalAlign="top"
                                        height={36}
                                        iconType="circle"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

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
                                                variant={survey.satisfaction_rating === 'satisfied' ? 'default' : 'destructive'}
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
