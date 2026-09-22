import { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  AreaChart, 
  Area,
  Legend
} from 'recharts';
import { ExpenseDataState, Category } from '../types';
import { formatCurrency } from '../utils/storage';
import { 
  TrendingUp, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  BarChart3, 
  LineChart as LineChartIcon,
  Sparkles,
  Zap,
  ArrowUpRight
} from 'lucide-react';

interface WeeklySpendingTrendsChartProps {
  data: ExpenseDataState;
  currency: string;
}

export function WeeklySpendingTrendsChart({ data, currency }: WeeklySpendingTrendsChartProps) {
  // Chart visual style: 'bar' (stacked by category) or 'area' (smooth trend curve)
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  
  // Week offset relative to today (0 = current week, -1 = last week, +1 = next week)
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Reference date: Anchor around the current local date (or today)
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  // Compute the start of the week (Monday) based on weekOffset
  const { weekStart, weekEnd, daysList, weekLabel } = useMemo(() => {
    const refDate = new Date(today);
    refDate.setDate(refDate.getDate() + weekOffset * 7);

    // Get Monday (0=Mon, 6=Sun)
    const dayOfWeek = (refDate.getDay() + 6) % 7;
    const monday = new Date(refDate);
    monday.setDate(refDate.getDate() - dayOfWeek);
    monday.setHours(0, 0, 0, 0);

    const days: {
      dateStr: string;
      dayName: string;
      displayLabel: string;
      shortDate: string;
      isToday: boolean;
    }[] = [];

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayNum}`;

      const isToday = dateStr === todayStr;
      const monthShort = d.toLocaleString('en-US', { month: 'short' });

      days.push({
        dateStr,
        dayName: dayNames[i],
        displayLabel: `${dayNames[i]} ${d.getDate()}`,
        shortDate: `${monthShort} ${d.getDate()}`,
        isToday,
      });
    }

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const startMonth = monday.toLocaleString('en-US', { month: 'short' });
    const endMonth = sunday.toLocaleString('en-US', { month: 'short' });
    const label = startMonth === endMonth 
      ? `${startMonth} ${monday.getDate()} – ${sunday.getDate()}, ${monday.getFullYear()}`
      : `${startMonth} ${monday.getDate()} – ${endMonth} ${sunday.getDate()}, ${monday.getFullYear()}`;

    return {
      weekStart: monday,
      weekEnd: sunday,
      daysList: days,
      weekLabel: label,
    };
  }, [today, todayStr, weekOffset]);

  // Aggregate daily expenses across all categories for the 7 days of this week
  const { chartData, weekTotal, peakDay, dailyAvg, categoryWeekTotals } = useMemo(() => {
    let total = 0;
    const catTotals: Record<string, number> = {};
    data.categories.forEach((c) => { catTotals[c.id] = 0; });

    let highestSpend = 0;
    let highestDayName = '';
    let highestDayDate = '';

    const points = daysList.map((day) => {
      let daySum = 0;
      const point: Record<string, any> = {
        dateStr: day.dateStr,
        dayName: day.dayName,
        displayLabel: day.displayLabel,
        shortDate: day.shortDate,
        isToday: day.isToday,
      };

      data.categories.forEach((cat) => {
        const catExpenses = data.expenses[cat.id] || [];
        const catDaySum = catExpenses
          .filter((item) => item.date === day.dateStr)
          .reduce((sum, item) => sum + (Number(item.spentAmt) || 0), 0);

        point[cat.id] = catDaySum;
        daySum += catDaySum;
        catTotals[cat.id] = (catTotals[cat.id] || 0) + catDaySum;
      });

      point.totalSpent = daySum;
      total += daySum;

      if (daySum > highestSpend) {
        highestSpend = daySum;
        highestDayName = day.dayName;
        highestDayDate = day.shortDate;
      }

      return point;
    });

    // Determine top category this week
    let topCat: Category | null = null;
    let topCatAmt = 0;
    data.categories.forEach((cat) => {
      const amt = catTotals[cat.id] || 0;
      if (amt > topCatAmt) {
        topCatAmt = amt;
        topCat = cat;
      }
    });

    return {
      chartData: points,
      weekTotal: total,
      dailyAvg: Math.round(total / 7),
      peakDay: highestSpend > 0 ? { day: highestDayName, date: highestDayDate, amount: highestSpend } : null,
      categoryWeekTotals: catTotals,
      topCategory: topCat,
    };
  }, [daysList, data]);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const dataPoint = payload[0]?.payload;
    const totalDay = dataPoint?.totalSpent || 0;

    return (
      <div className="bg-white/95 backdrop-blur-xs p-3.5 rounded-xl border border-slate-200 shadow-lg text-xs min-w-[210px] space-y-2">
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-800">
              {dataPoint?.displayLabel}
            </span>
            {dataPoint?.isToday && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700">
                Today
              </span>
            )}
          </div>
          <span className="text-slate-400 font-mono text-[11px]">
            {dataPoint?.dateStr}
          </span>
        </div>

        {/* Breakdown by Category */}
        <div className="space-y-1 py-0.5">
          {data.categories.map((cat) => {
            const catAmt = Number(dataPoint?.[cat.id]) || 0;
            if (catAmt <= 0) return null;

            return (
              <div key={cat.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 truncate max-w-[130px]">
                  <span 
                    className="w-2 h-2 rounded-full shrink-0" 
                    style={{ backgroundColor: cat.color }} 
                  />
                  <span className="text-slate-600 truncate">{cat.name}</span>
                </div>
                <span className="font-mono font-semibold text-slate-800">
                  {formatCurrency(catAmt, currency)}
                </span>
              </div>
            );
          })}
          {totalDay === 0 && (
            <div className="text-slate-400 italic py-1 text-center">
              No expenses recorded on this day
            </div>
          )}
        </div>

        {/* Day Total */}
        <div className="border-t border-slate-100 pt-1.5 flex items-center justify-between font-bold">
          <span className="text-slate-600 uppercase tracking-wider text-[10px]">
            Day Total
          </span>
          <span className="text-slate-900 font-mono text-sm">
            {formatCurrency(totalDay, currency)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <section 
      id="section-weekly-trends"
      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-200"
    >
      {/* Header with Title, Controls, and Navigation */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Daily Spending Trends — Current Week
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Aggregates daily spending from all {data.categories.length} category tables with day-by-day comparison.
          </p>
        </div>

        {/* Controls: Week Navigation & Chart View Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Week Selector */}
          <div className="flex items-center bg-slate-100/90 border border-slate-200 rounded-lg p-0.5 text-xs">
            <button
              id="btn-prev-week"
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-colors"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2.5 font-semibold text-slate-700 select-none">
              {weekOffset === 0 ? 'This Week' : weekOffset === -1 ? 'Last Week' : `Week ${weekOffset > 0 ? `+${weekOffset}` : weekOffset}`}
            </span>

            <button
              id="btn-next-week"
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-colors"
              title="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              Reset to Current Week
            </button>
          )}

          {/* Chart Type Toggle (Stacked Bar vs Area Curve) */}
          <div className="flex items-center bg-slate-100/90 border border-slate-200 rounded-lg p-0.5 text-xs">
            <button
              id="btn-chart-bar"
              onClick={() => setChartType('bar')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded transition-all ${
                chartType === 'bar'
                  ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Stacked Category Bars"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Category Stack</span>
            </button>
            <button
              id="btn-chart-area"
              onClick={() => setChartType('area')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded transition-all ${
                chartType === 'area'
                  ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Smooth Spending Trend"
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>Trend Area</span>
            </button>
          </div>
        </div>
      </div>

      {/* Week Metrics Snapshot Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-slate-50/50 border-b border-slate-100 text-xs">
        <div className="p-4">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">
            Week Date Range
          </span>
          <div className="font-bold text-slate-800 mt-0.5 truncate">
            {weekLabel}
          </div>
        </div>

        <div className="p-4">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">
            Week Aggregate Spend
          </span>
          <div className="font-bold text-slate-900 font-mono text-sm mt-0.5">
            {formatCurrency(weekTotal, currency)}
          </div>
        </div>

        <div className="p-4">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">
            Daily Average
          </span>
          <div className="font-bold text-indigo-700 font-mono text-sm mt-0.5">
            {formatCurrency(dailyAvg, currency)}
            <span className="text-[10px] font-normal text-slate-400 font-sans ml-1">/day</span>
          </div>
        </div>

        <div className="p-4">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">
            Peak Spending Day
          </span>
          <div className="font-bold text-slate-800 mt-0.5 truncate">
            {peakDay ? (
              <span className="text-rose-600 font-mono">
                {peakDay.day} ({formatCurrency(peakDay.amount, currency)})
              </span>
            ) : (
              <span className="text-slate-400 font-normal">No expenses this week</span>
            )}
          </div>
        </div>
      </div>

      {/* Chart Visualization Area */}
      <div className="p-5 sm:p-6">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="displayLabel" 
                  tickLine={false} 
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
                  tickFormatter={(val) => {
                    if (val >= 100000) return `${val / 100000}L`;
                    if (val >= 1000) return `${val / 1000}k`;
                    return `${val}`;
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                {/* Stacked bars for each category */}
                {data.categories.map((cat, idx) => (
                  <Bar
                    key={cat.id}
                    dataKey={cat.id}
                    name={cat.name}
                    stackId="weeklyExpenses"
                    fill={cat.color || '#4f46e5'}
                    radius={
                      idx === data.categories.length - 1
                        ? [4, 4, 0, 0]
                        : [0, 0, 0, 0]
                    }
                  />
                ))}
              </BarChart>
            ) : (
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="displayLabel" 
                  tickLine={false} 
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
                  tickFormatter={(val) => {
                    if (val >= 100000) return `${val / 100000}L`;
                    if (val >= 1000) return `${val / 1000}k`;
                    return `${val}`;
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="totalSpent"
                  name="Total Daily Spend"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#spendGradient)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Category Legend & Day Indicators */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Legend showing all category colors */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
              Categories:
            </span>
            {data.categories.map((cat) => {
              const weekCatAmt = categoryWeekTotals[cat.id] || 0;
              return (
                <div key={cat.id} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-medium text-slate-700">{cat.name}</span>
                  {weekCatAmt > 0 && (
                    <span className="text-slate-400 font-mono text-[11px]">
                      ({formatCurrency(weekCatAmt, currency)})
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Daily Quick Summary Chips */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {chartData.map((d) => (
              <div 
                key={d.dateStr}
                className={`px-2 py-1 rounded text-center min-w-[50px] transition-colors ${
                  d.isToday
                    ? 'bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold'
                    : d.totalSpent > 0 
                      ? 'bg-slate-50 border border-slate-200 text-slate-700'
                      : 'text-slate-400'
                }`}
              >
                <div className="text-[10px] uppercase font-semibold">
                  {d.dayName} {d.isToday && '•'}
                </div>
                <div className="font-mono text-[11px]">
                  {d.totalSpent > 0 ? (
                    <span>{formatCurrency(d.totalSpent, currency).replace(currency, '').trim()}</span>
                  ) : (
                    <span>—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
