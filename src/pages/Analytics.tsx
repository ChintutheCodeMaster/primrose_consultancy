import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Users, UserPlus, TrendingUp, ArrowRight, Filter } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  Funnel,
  FunnelChart,
  LabelList,
} from 'recharts';

// Vibrant, distinguishable colors
const COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#F59E0B', // Yellow/Amber
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

// Generate season years (current year + 2 years forward, 5 years back)
const generateSeasonYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear + 2; i >= currentYear - 5; i--) {
    years.push(i.toString());
  }
  return years;
};

const SEASON_YEARS = generateSeasonYears();

export default function Analytics() {
  const [seasonFilter, setSeasonFilter] = useState<string>('all');

  // Fetch students data
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['analytics-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('did_not_continue', false);
      if (error) throw error;
      return data;
    },
  });

  // Fetch leads data
  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ['analytics-leads'],
    queryFn: async () => {
      const { data, error } = await supabase.from('leads').select('*');
      if (error) throw error;
      return data;
    },
  });

  const isLoading = studentsLoading || leadsLoading;

  // Filter data by season
  const filteredStudents = useMemo(() => {
    if (!students) return [];
    if (seasonFilter === 'all') return students;
    return students.filter(s => s.graduation_year === seasonFilter);
  }, [students, seasonFilter]);

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    if (seasonFilter === 'all') return leads;
    // For leads, filter by creation year as approximation for season
    return leads.filter(l => {
      const createdYear = new Date(l.created_at).getFullYear().toString();
      return createdYear === seasonFilter;
    });
  }, [leads, seasonFilter]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  // Calculate students by year
  const studentsByYear = (filteredStudents || []).reduce((acc, student) => {
    const year = new Date(student.created_at).getFullYear().toString();
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const studentsByYearData = Object.entries(studentsByYear)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, count]) => ({ year, count }));

  // Calculate average package cost by year
  const packageCostByYear = (filteredStudents || []).reduce((acc, student) => {
    if (student.package_cost && student.package_cost > 0) {
      const year = new Date(student.created_at).getFullYear().toString();
      if (!acc[year]) acc[year] = { total: 0, count: 0 };
      acc[year].total += Number(student.package_cost);
      acc[year].count += 1;
    }
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const avgPackageCostData = Object.entries(packageCostByYear)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, data]) => ({
      year,
      average: Math.round(data.total / data.count),
    }));

  // Calculate students by source
  const studentsBySource = (filteredStudents || []).reduce((acc, student) => {
    const source = student.source || 'לא ידוע';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const studentsBySourceData = Object.entries(studentsBySource)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([source, count]) => ({ source, count }));

  // Source comparison: Active students vs Did not continue
  const allSources = new Set<string>();
  
  // Active students by source
  const activeStudentsBySource = (students || [])
    .filter(s => !s.did_not_continue)
    .reduce((acc, student) => {
      const source = student.source || 'לא ידוע';
      allSources.add(source);
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  // Did not continue students by source
  const didNotContinueStudentsBySource = (students || [])
    .filter(s => s.did_not_continue)
    .reduce((acc, student) => {
      const source = student.source || 'לא ידוע';
      allSources.add(source);
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  // Did not continue leads by source
  const didNotContinueLeadsBySource = (leads || [])
    .filter(l => l.did_not_continue)
    .reduce((acc, lead) => {
      const source = lead.source || 'לא ידוע';
      allSources.add(source);
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  // Combine data for comparison chart
  const sourceComparisonData = Array.from(allSources)
    .map(source => ({
      source,
      active: activeStudentsBySource[source] || 0,
      didNotContinue: (didNotContinueStudentsBySource[source] || 0) + (didNotContinueLeadsBySource[source] || 0),
    }))
    .filter(d => d.active > 0 || d.didNotContinue > 0)
    .sort((a, b) => (b.active + b.didNotContinue) - (a.active + a.didNotContinue))
    .slice(0, 8);

  // Conversion funnel data
  const totalLeads = (filteredLeads || []).length;
  const activeLeads = (filteredLeads || []).filter(l => !l.did_not_continue).length;
  const convertedToStudents = (filteredStudents || []).length;
  const signedAgreement = (filteredStudents || []).filter(s => s.signed_agreement).length;
  const paidStudents = (filteredStudents || []).filter(s => s.is_paid).length;

  const funnelData = [
    { name: 'מתעניינים', value: totalLeads, fill: 'hsl(var(--chart-1))' },
    { name: 'פעילים', value: activeLeads, fill: 'hsl(var(--chart-2))' },
    { name: 'הפכו לסטודנטים', value: convertedToStudents, fill: 'hsl(var(--chart-3))' },
    { name: 'חתמו הסכם', value: signedAgreement, fill: 'hsl(var(--chart-4))' },
    { name: 'שילמו', value: paidStudents, fill: 'hsl(var(--chart-5))' },
  ];

  // Students by degree type
  const studentsByDegree = (filteredStudents || []).reduce((acc, student) => {
    const degree = student.degree_type || 'לא ידוע';
    acc[degree] = (acc[degree] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const degreeLabels: Record<string, string> = {
    bachelor: 'תואר ראשון',
    master: 'תואר שני',
    phd: 'דוקטורט',
    'לא ידוע': 'לא ידוע',
  };

  const studentsByDegreeData = Object.entries(studentsByDegree).map(([degree, count]) => ({
    name: degreeLabels[degree] || degree,
    value: count,
  }));

  // Students by country
  const studentsByCountry = (filteredStudents || []).reduce((acc, student) => {
    const country = student.interested_country || student.target_country || 'לא ידוע';
    // Handle multiple countries (comma separated)
    const countries = country.split(',').map(c => c.trim()).filter(Boolean);
    countries.forEach(c => {
      acc[c] = (acc[c] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const studentsByCountryData = Object.entries(studentsByCountry)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([country, count]) => ({
      name: country,
      value: count,
    }));

  // Monthly trend (last 12 months)
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    return {
      month: date.toLocaleDateString('he-IL', { month: 'short', year: '2-digit' }),
      monthKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
    };
  });

  const monthlyStudents = (filteredStudents || []).reduce((acc, student) => {
    const date = new Date(student.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const monthlyTrendData = last12Months.map(({ month, monthKey }) => ({
    month,
    students: monthlyStudents[monthKey] || 0,
  }));

  // Monthly conversion data (leads vs students created each month)
  const monthlyLeads = (leads || []).reduce((acc, lead) => {
    const date = new Date(lead.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const monthlyStudentsAll = (students || []).reduce((acc, student) => {
    const date = new Date(student.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const monthlyConversionData = last12Months.map(({ month, monthKey }) => {
    const leadsCount = monthlyLeads[monthKey] || 0;
    const studentsCount = monthlyStudentsAll[monthKey] || 0;
    const conversionRate = leadsCount > 0 ? Math.round((studentsCount / leadsCount) * 100) : 0;
    return {
      month,
      leads: leadsCount,
      students: studentsCount,
      conversionRate,
    };
  });

  // Conversion by season (graduation_year)
  const conversionBySeason = SEASON_YEARS.map(year => {
    const seasonStudents = (students || []).filter(s => s.graduation_year === year);
    const seasonLeads = (leads || []).filter(l => {
      const createdYear = new Date(l.created_at).getFullYear().toString();
      return createdYear === year;
    });
    const leadsCount = seasonLeads.length;
    const studentsCount = seasonStudents.length;
    const conversionRate = leadsCount > 0 ? Math.round((studentsCount / leadsCount) * 100) : 0;
    return {
      season: year,
      leads: leadsCount,
      students: studentsCount,
      conversionRate,
    };
  }).filter(d => d.leads > 0 || d.students > 0);

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">אנליטיקס</h1>
            <p className="text-muted-foreground mt-1">סטטיסטיקות ונתונים על הסטודנטים והמתעניינים</p>
          </div>
          
          {/* Season Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={seasonFilter} onValueChange={setSeasonFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="עונת הגשה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל העונות</SelectItem>
                {SEASON_YEARS.map((year) => (
                  <SelectItem key={year} value={year}>עונת {year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">סה״כ מתעניינים</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLeads}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">סה״כ סטודנטים</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{convertedToStudents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">יחס המרה</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalLeads > 0 ? Math.round((convertedToStudents / totalLeads) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">מחיר ממוצע לחבילה</CardTitle>
              <span className="text-muted-foreground">₪</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {avgPackageCostData.length > 0
                  ? `₪${avgPackageCostData[avgPackageCostData.length - 1]?.average?.toLocaleString() || 0}`
                  : '₪0'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Funnel Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              משפך המרה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4 py-4">
              {funnelData.map((item, index) => (
                <div key={item.name} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full rounded-lg flex items-center justify-center text-white font-bold text-xl py-8"
                    style={{
                      backgroundColor: item.fill,
                      opacity: 1 - index * 0.15,
                    }}
                  >
                    {item.value}
                  </div>
                  <span className="mt-2 text-sm text-muted-foreground text-center">{item.name}</span>
                  {index < funnelData.length - 1 && index > 0 && (
                    <span className="text-xs text-muted-foreground mt-1">
                      ({funnelData[0].value > 0 ? Math.round((item.value / funnelData[0].value) * 100) : 0}%)
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Students by Year */}
          <Card>
            <CardHeader>
              <CardTitle>סטודנטים לפי שנה</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={studentsByYearData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" name="סטודנטים" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Average Package Cost by Year */}
          <Card>
            <CardHeader>
              <CardTitle>מחיר ממוצע לחבילה לפי שנה</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={avgPackageCostData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₪${Number(value).toLocaleString()}`, 'ממוצע']} />
                  <Line
                    type="monotone"
                    dataKey="average"
                    name="מחיר ממוצע"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle>מגמת סטודנטים חדשים (12 חודשים אחרונים)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="students" name="סטודנטים" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Conversion - Leads vs Students */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>המרה חודשית - מתעניינים לסטודנטים (12 חודשים אחרונים)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyConversionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'יחס המרה') return [`${value}%`, name];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="leads" name="מתעניינים" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="students" name="סטודנטים" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="conversionRate" name="יחס המרה" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Conversion by Season */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>המרה לפי עונת הגשה</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={conversionBySeason}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="season" tickFormatter={(v) => `עונת ${v}`} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'יחס המרה') return [`${value}%`, name];
                      return [value, name];
                    }}
                    labelFormatter={(label) => `עונת ${label}`}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="leads" name="מתעניינים" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="students" name="סטודנטים (לקוחות עבר)" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="conversionRate" name="יחס המרה" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Students by Source */}
          <Card>
            <CardHeader>
              <CardTitle>סטודנטים לפי מקור הגעה</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={studentsBySourceData} layout="vertical" margin={{ left: 20, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="source" 
                    type="category" 
                    width={140} 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.length > 18 ? value.substring(0, 18) + '...' : value}
                  />
                  <Tooltip />
                  <Bar dataKey="count" name="סטודנטים" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Source Comparison: Active vs Did Not Continue */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>מקור הפניה - סטודנטים פעילים לעומת לא המשיכו</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={sourceComparisonData} margin={{ left: 20, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="source" 
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => value.length > 12 ? value.substring(0, 12) + '...' : value}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="active" name="סטודנטים פעילים" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="didNotContinue" name="לא המשיכו" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Students by Degree */}
          <Card>
            <CardHeader>
              <CardTitle>התפלגות לפי סוג תואר</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={studentsByDegreeData}
                      cx="50%"
                      cy="45%"
                      labelLine={true}
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {studentsByDegreeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      wrapperStyle={{ paddingTop: '20px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Students by Country */}
          <Card>
            <CardHeader>
              <CardTitle>התפלגות לפי מדינה</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={studentsByCountryData}
                      cx="50%"
                      cy="45%"
                      labelLine={true}
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {studentsByCountryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      wrapperStyle={{ paddingTop: '20px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
