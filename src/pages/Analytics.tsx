import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, UserPlus, TrendingUp, ArrowRight } from 'lucide-react';
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

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Analytics() {
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
  const studentsByYear = (students || []).reduce((acc, student) => {
    const year = new Date(student.created_at).getFullYear().toString();
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const studentsByYearData = Object.entries(studentsByYear)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, count]) => ({ year, count }));

  // Calculate average package cost by year
  const packageCostByYear = (students || []).reduce((acc, student) => {
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
  const studentsBySource = (students || []).reduce((acc, student) => {
    const source = student.source || 'לא ידוע';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const studentsBySourceData = Object.entries(studentsBySource)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([source, count]) => ({ source, count }));

  // Conversion funnel data
  const totalLeads = (leads || []).length;
  const activeLeads = (leads || []).filter(l => !l.did_not_continue).length;
  const convertedToStudents = (students || []).length;
  const signedAgreement = (students || []).filter(s => s.signed_agreement).length;
  const paidStudents = (students || []).filter(s => s.is_paid).length;

  const funnelData = [
    { name: 'מתעניינים', value: totalLeads, fill: 'hsl(var(--chart-1))' },
    { name: 'פעילים', value: activeLeads, fill: 'hsl(var(--chart-2))' },
    { name: 'הפכו לסטודנטים', value: convertedToStudents, fill: 'hsl(var(--chart-3))' },
    { name: 'חתמו הסכם', value: signedAgreement, fill: 'hsl(var(--chart-4))' },
    { name: 'שילמו', value: paidStudents, fill: 'hsl(var(--chart-5))' },
  ];

  // Students by degree type
  const studentsByDegree = (students || []).reduce((acc, student) => {
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

  // Monthly trend (last 12 months)
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    return {
      month: date.toLocaleDateString('he-IL', { month: 'short', year: '2-digit' }),
      monthKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
    };
  });

  const monthlyStudents = (students || []).reduce((acc, student) => {
    const date = new Date(student.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const monthlyTrendData = last12Months.map(({ month, monthKey }) => ({
    month,
    students: monthlyStudents[monthKey] || 0,
  }));

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">אנליטיקס</h1>
          <p className="text-muted-foreground mt-1">סטטיסטיקות ונתונים על הסטודנטים והמתעניינים</p>
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

          {/* Students by Source */}
          <Card>
            <CardHeader>
              <CardTitle>סטודנטים לפי מקור הגעה</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={studentsBySourceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="source" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="count" name="סטודנטים" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Students by Degree */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>התפלגות לפי סוג תואר</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={studentsByDegreeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {studentsByDegreeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
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
