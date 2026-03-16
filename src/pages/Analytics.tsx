import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Users, UserPlus, TrendingUp, ArrowRight, Filter, DollarSign, Briefcase } from 'lucide-react';
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

  // Fetch income data (students with payment_date)
  const { data: incomeData, isLoading: incomeLoading } = useQuery({
    queryKey: ['analytics-income'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, amount_paid, payment_date, advisor_name, graduation_year')
        .eq('is_paid', true)
        .not('payment_date', 'is', null)
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch projects data
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['analytics-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, amount, payment_date, payment_direction, collaboration_id')
        .not('payment_date', 'is', null);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch accepted universities
  const { data: acceptedUniversities, isLoading: uniLoading } = useQuery({
    queryKey: ['analytics-accepted-universities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accepted_universities')
        .select('name, student_id');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch collaborations for names
  const { data: collaborations, isLoading: collabsLoading } = useQuery({
    queryKey: ['analytics-collaborations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collaborations')
        .select('id, name');
      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = studentsLoading || leadsLoading || incomeLoading || projectsLoading || collabsLoading || uniLoading;

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
    { name: 'מתעניינים', value: totalLeads, fill: COLORS[0] },
    { name: 'פעילים', value: activeLeads, fill: COLORS[1] },
    { name: 'הפכו לסטודנטים', value: convertedToStudents, fill: COLORS[2] },
    { name: 'חתמו הסכם', value: signedAgreement, fill: COLORS[3] },
    { name: 'שילמו', value: paidStudents, fill: COLORS[4] },
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

  // Students by field of study
  const studentsByField = (filteredStudents || []).reduce((acc, student) => {
    const field = student.interested_field || 'לא ידוע';
    acc[field] = (acc[field] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const studentsByFieldData = Object.entries(studentsByField)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([field, count]) => ({
      name: field,
      value: count,
    }));

  // Students by university (target_university + accepted_universities)
  const filteredStudentIds = new Set((filteredStudents || []).map(s => s.id));
  const studentsByUniversity: Record<string, number> = {};
  
  // Count target universities
  (filteredStudents || []).forEach(student => {
    if (student.target_university) {
      studentsByUniversity[student.target_university] = (studentsByUniversity[student.target_university] || 0) + 1;
    }
  });
  
  // Count accepted universities (only for filtered students)
  (acceptedUniversities || []).forEach(au => {
    if (filteredStudentIds.has(au.student_id) && au.name) {
      // Only count if not already counted as target university for the same student
      studentsByUniversity[au.name] = (studentsByUniversity[au.name] || 0) + 1;
    }
  });

  const studentsByUniversityData = Object.entries(studentsByUniversity)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({
      name,
      value: count,
    }));

  // Average package cost by season
  const avgCostBySeason = SEASON_YEARS.map(year => {
    const seasonStudents = (students || []).filter(s => s.graduation_year === year && s.package_cost && s.package_cost > 0);
    const total = seasonStudents.reduce((sum, s) => sum + Number(s.package_cost), 0);
    const count = seasonStudents.length;
    return {
      label: `עונת ${year}`,
      average: count > 0 ? Math.round(total / count) : 0,
      count,
    };
  }).filter(d => d.count > 0);

  // Average package cost by degree type
  const avgCostByDegree = Object.entries(
    (students || []).reduce((acc, student) => {
      if (student.package_cost && student.package_cost > 0) {
        const degree = student.degree_type || 'לא ידוע';
        if (!acc[degree]) acc[degree] = { total: 0, count: 0 };
        acc[degree].total += Number(student.package_cost);
        acc[degree].count += 1;
      }
      return acc;
    }, {} as Record<string, { total: number; count: number }>)
  ).map(([degree, data]) => ({
    label: degreeLabels[degree] || degree,
    average: Math.round(data.total / data.count),
    count: data.count,
  })).sort((a, b) => b.average - a.average);

  // Average package cost by country
  const avgCostByCountry = Object.entries(
    (students || []).reduce((acc, student) => {
      if (student.package_cost && student.package_cost > 0) {
        const country = student.interested_country || student.target_country || 'לא ידוע';
        const countries = country.split(',').map(c => c.trim()).filter(Boolean);
        countries.forEach(c => {
          if (!acc[c]) acc[c] = { total: 0, count: 0 };
          acc[c].total += Number(student.package_cost);
          acc[c].count += 1;
        });
      }
      return acc;
    }, {} as Record<string, { total: number; count: number }>)
  ).map(([country, data]) => ({
    label: country,
    average: Math.round(data.total / data.count),
    count: data.count,
  })).sort((a, b) => b.average - a.average);

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

  // Income this month calculation
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const incomeThisMonth = (incomeData || [])
    .filter(s => {
      const paymentDate = new Date(s.payment_date);
      return paymentDate.getMonth() === currentMonth && 
             paymentDate.getFullYear() === currentYear;
    });
  
  const totalIncomeThisMonth = incomeThisMonth.reduce((sum, s) => sum + (Number(s.amount_paid) || 0), 0);

  // Projects income/expense - group by collaboration
  const collabMap = (collaborations || []).reduce((acc, c) => {
    acc[c.id] = c.name;
    return acc;
  }, {} as Record<string, string>);

  // Group projects by collaboration
  const projectsByCollabGrouped = (projects || [])
    .filter(p => p.amount && Number(p.amount) > 0)
    .reduce((acc, p) => {
      const collabName = p.collaboration_id ? (collabMap[p.collaboration_id] || 'ללא שיוך') : 'ללא שיוך';
      if (!acc[collabName]) acc[collabName] = { income: 0, expense: 0, projects: [] as { name: string; amount: number; direction: string; date: string | null }[] };
      const amount = Number(p.amount);
      if (p.payment_direction === 'income') {
        acc[collabName].income += amount;
      } else {
        acc[collabName].expense += amount;
      }
      acc[collabName].projects.push({
        name: p.name,
        amount,
        direction: p.payment_direction,
        date: p.payment_date,
      });
      return acc;
    }, {} as Record<string, { income: number; expense: number; projects: { name: string; amount: number; direction: string; date: string | null }[] }>);

  const collabGroupedData = Object.entries(projectsByCollabGrouped)
    .sort(([, a], [, b]) => (b.income - b.expense) - (a.income - a.expense));

  const totalProjectIncome = collabGroupedData.reduce((s, [, d]) => s + d.income, 0);
  const totalProjectExpense = collabGroupedData.reduce((s, [, d]) => s + d.expense, 0);

  // Projects by year and collaboration for stacked bar chart
  const projectsByYearCollab = (projects || [])
    .filter(p => p.amount && Number(p.amount) > 0 && p.payment_date)
    .reduce((acc, p) => {
      const year = new Date(p.payment_date!).getFullYear().toString();
      const collabName = p.collaboration_id ? (collabMap[p.collaboration_id] || 'ללא שיוך') : 'ללא שיוך';
      if (!acc[year]) acc[year] = {} as Record<string, number>;
      if (!acc[year][collabName]) acc[year][collabName] = 0;
      const amount = Number(p.amount);
      acc[year][collabName] += p.payment_direction === 'income' ? amount : -amount;
      return acc;
    }, {} as Record<string, Record<string, number>>);

  const allCollabNames = [...new Set((projects || [])
    .filter(p => p.amount && Number(p.amount) > 0)
    .map(p => p.collaboration_id ? (collabMap[p.collaboration_id] || 'ללא שיוך') : 'ללא שיוך')
  )];

  const projectsByYearCollabData = Object.entries(projectsByYearCollab)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, collabs]) => ({
      year,
      ...collabs,
    }));

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

        {/* Income This Month */}
        <Card id="income-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              הכנסות החודש - ₪{totalIncomeThisMonth.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {incomeThisMonth.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right w-[25%]">שם</TableHead>
                      <TableHead className="text-right w-[20%]">סכום ששולם</TableHead>
                      <TableHead className="text-right w-[20%]">תאריך תשלום</TableHead>
                      <TableHead className="text-right w-[15%]">יועץ</TableHead>
                      <TableHead className="text-right w-[20%]">סוג</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomeThisMonth.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium text-right">{student.name}</TableCell>
                        <TableCell className="text-right" dir="ltr">₪{Number(student.amount_paid).toLocaleString()}</TableCell>
                        <TableCell className="text-right">{new Date(student.payment_date).toLocaleDateString('he-IL')}</TableCell>
                        <TableCell className="text-right">{student.advisor_name || '-'}</TableCell>
                        <TableCell className="text-right">{student.graduation_year ? `לקוח עבר ${student.graduation_year}` : 'סטודנט פעיל'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                אין תשלומים שנרשמו החודש
              </div>
            )}
          </CardContent>
        </Card>

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
                  <Bar dataKey="count" name="סטודנטים" radius={[4, 4, 0, 0]}>
                    {studentsByYearData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    <LabelList dataKey="count" position="top" fill="hsl(var(--foreground))" fontSize={12} fontWeight={600} />
                  </Bar>
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
                  <YAxis tickFormatter={(v) => `₪${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => [`₪${Number(value).toLocaleString()}`, 'ממוצע']} />
                  <Line
                    type="monotone"
                    dataKey="average"
                    name="מחיר ממוצע"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', r: 6 }}
                  >
                    <LabelList 
                      dataKey="average" 
                      position="top" 
                      fill="hsl(var(--foreground))" 
                      fontSize={11} 
                      fontWeight={600}
                      formatter={(value: number) => `₪${(value/1000).toFixed(1)}k`}
                    />
                  </Line>
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
                  <Bar dataKey="students" name="סטודנטים" radius={[4, 4, 0, 0]}>
                    {monthlyTrendData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    <LabelList dataKey="students" position="top" fill="hsl(var(--foreground))" fontSize={11} fontWeight={600} />
                  </Bar>
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
                  <Bar yAxisId="left" dataKey="leads" name="מתעניינים" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="leads" position="top" fill="#3B82F6" fontSize={10} fontWeight={600} />
                  </Bar>
                  <Bar yAxisId="left" dataKey="students" name="סטודנטים" fill="#10B981" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="students" position="top" fill="#10B981" fontSize={10} fontWeight={600} />
                  </Bar>
                  <Line yAxisId="right" type="monotone" dataKey="conversionRate" name="יחס המרה" stroke="#F59E0B" strokeWidth={3} dot={{ fill: '#F59E0B', r: 5 }} />
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
                  <Bar yAxisId="left" dataKey="leads" name="מתעניינים" fill="#8B5CF6" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="leads" position="top" fill="#8B5CF6" fontSize={11} fontWeight={600} />
                  </Bar>
                  <Bar yAxisId="left" dataKey="students" name="סטודנטים (לקוחות עבר)" fill="#EC4899" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="students" position="top" fill="#EC4899" fontSize={11} fontWeight={600} />
                  </Bar>
                  <Line yAxisId="right" type="monotone" dataKey="conversionRate" name="יחס המרה" stroke="#06B6D4" strokeWidth={3} dot={{ fill: '#06B6D4', r: 5 }} />
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
                <BarChart data={studentsBySourceData} layout="vertical" margin={{ left: 20, right: 40 }}>
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
                  <Bar dataKey="count" name="סטודנטים" radius={[0, 4, 4, 0]}>
                    {studentsBySourceData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    <LabelList dataKey="count" position="right" fill="hsl(var(--foreground))" fontSize={12} fontWeight={600} />
                  </Bar>
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
                  <Bar dataKey="active" name="סטודנטים פעילים" fill="#10B981" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="active" position="top" fill="#10B981" fontSize={11} fontWeight={600} />
                  </Bar>
                  <Bar dataKey="didNotContinue" name="לא המשיכו" fill="#EF4444" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="didNotContinue" position="top" fill="#EF4444" fontSize={11} fontWeight={600} />
                  </Bar>
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
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={studentsByDegreeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={false}
                    >
                      {studentsByDegreeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                    <Legend 
                      layout="vertical" 
                      verticalAlign="middle" 
                      align="right"
                      wrapperStyle={{ paddingRight: '20px' }}
                      formatter={(value, entry: any) => {
                        const item = studentsByDegreeData.find(d => d.name === value);
                        const total = studentsByDegreeData.reduce((sum, d) => sum + d.value, 0);
                        const percent = item ? Math.round((item.value / total) * 100) : 0;
                        return (
                          <span style={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}>
                            {value}: {item?.value} ({percent}%)
                          </span>
                        );
                      }}
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
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={studentsByCountryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={false}
                    >
                      {studentsByCountryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                    <Legend 
                      layout="vertical" 
                      verticalAlign="middle" 
                      align="right"
                      wrapperStyle={{ paddingRight: '20px' }}
                      formatter={(value, entry: any) => {
                        const item = studentsByCountryData.find(d => d.name === value);
                        const total = studentsByCountryData.reduce((sum, d) => sum + d.value, 0);
                        const percent = item ? Math.round((item.value / total) * 100) : 0;
                        return (
                          <span style={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}>
                            {value}: {item?.value} ({percent}%)
                          </span>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Students by Field of Study */}
          <Card>
            <CardHeader>
              <CardTitle>התפלגות לפי תחום לימודים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={studentsByFieldData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={false}
                    >
                      {studentsByFieldData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                    <Legend 
                      layout="vertical" 
                      verticalAlign="middle" 
                      align="right"
                      wrapperStyle={{ paddingRight: '20px' }}
                      formatter={(value, entry: any) => {
                        const item = studentsByFieldData.find(d => d.name === value);
                        const total = studentsByFieldData.reduce((sum, d) => sum + d.value, 0);
                        const percent = item ? Math.round((item.value / total) * 100) : 0;
                        return (
                          <span style={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}>
                            {value}: {item?.value} ({percent}%)
                          </span>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Students by University */}
          <Card>
            <CardHeader>
              <CardTitle>התפלגות לפי אוניברסיטה</CardTitle>
            </CardHeader>
            <CardContent>
              {studentsByUniversityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={studentsByUniversityData} layout="vertical" margin={{ left: 20, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={160} 
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => value.length > 22 ? value.substring(0, 22) + '...' : value}
                    />
                    <Tooltip />
                    <Bar dataKey="value" name="סטודנטים" radius={[0, 4, 4, 0]}>
                      {studentsByUniversityData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                      <LabelList dataKey="value" position="right" fill="hsl(var(--foreground))" fontSize={12} fontWeight={600} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">אין נתונים</div>
              )}
            </CardContent>
          </Card>

            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                מחיר חבילה ממוצע
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="season" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="season">לפי עונה</TabsTrigger>
                  <TabsTrigger value="degree">לפי סוג תואר</TabsTrigger>
                  <TabsTrigger value="country">לפי מדינה</TabsTrigger>
                </TabsList>
                
                <TabsContent value="season">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-primary/10">
                        <TableHead className="text-right font-bold text-primary">עונה</TableHead>
                        <TableHead className="text-right font-bold text-primary">מחיר ממוצע</TableHead>
                        <TableHead className="text-right font-bold text-primary">מספר סטודנטים</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {avgCostBySeason.length > 0 ? avgCostBySeason.map((row, index) => (
                        <TableRow 
                          key={index}
                          className={index % 2 === 0 ? 'bg-muted/30' : 'bg-background'}
                        >
                          <TableCell className="font-medium">{row.label}</TableCell>
                          <TableCell className="text-emerald-600 dark:text-emerald-400 font-semibold">₪{row.average.toLocaleString()}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium text-sm">
                              {row.count}
                            </span>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">אין נתונים</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
                
                <TabsContent value="degree">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-purple-100 dark:bg-purple-900/30">
                        <TableHead className="text-right font-bold text-purple-700 dark:text-purple-300">סוג תואר</TableHead>
                        <TableHead className="text-right font-bold text-purple-700 dark:text-purple-300">מחיר ממוצע</TableHead>
                        <TableHead className="text-right font-bold text-purple-700 dark:text-purple-300">מספר סטודנטים</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {avgCostByDegree.length > 0 ? avgCostByDegree.map((row, index) => (
                        <TableRow 
                          key={index}
                          className={index % 2 === 0 ? 'bg-muted/30' : 'bg-background'}
                        >
                          <TableCell className="font-medium">{row.label}</TableCell>
                          <TableCell className="text-emerald-600 dark:text-emerald-400 font-semibold">₪{row.average.toLocaleString()}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium text-sm">
                              {row.count}
                            </span>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">אין נתונים</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
                
                <TabsContent value="country">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-amber-100 dark:bg-amber-900/30">
                        <TableHead className="text-right font-bold text-amber-700 dark:text-amber-300">מדינה</TableHead>
                        <TableHead className="text-right font-bold text-amber-700 dark:text-amber-300">מחיר ממוצע</TableHead>
                        <TableHead className="text-right font-bold text-amber-700 dark:text-amber-300">מספר סטודנטים</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {avgCostByCountry.length > 0 ? avgCostByCountry.map((row, index) => (
                        <TableRow 
                          key={index}
                          className={index % 2 === 0 ? 'bg-muted/30' : 'bg-background'}
                        >
                          <TableCell className="font-medium">{row.label}</TableCell>
                          <TableCell className="text-emerald-600 dark:text-emerald-400 font-semibold">₪{row.average.toLocaleString()}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium text-sm">
                              {row.count}
                            </span>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">אין נתונים</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Projects Income Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              הכנסות פרויקטים ושת״פ
            </CardTitle>
            <div className="flex gap-4 text-sm mt-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">הכנסות: ₪{totalProjectIncome.toLocaleString()}</span>
              <span className="text-destructive font-semibold">הוצאות: ₪{totalProjectExpense.toLocaleString()}</span>
              <span className="font-semibold">יתרה: ₪{(totalProjectIncome - totalProjectExpense).toLocaleString()}</span>
            </div>
          </CardHeader>
          <CardContent>
            {collabGroupedData.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-right font-bold">גוף שת״פ</TableHead>
                      <TableHead className="text-right font-bold">פרויקט</TableHead>
                      <TableHead className="text-right font-bold">סוג</TableHead>
                      <TableHead className="text-right font-bold">סכום</TableHead>
                      <TableHead className="text-right font-bold">תאריך תשלום</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collabGroupedData.map(([collabName, data]) => (
                      <>
                        {data.projects.map((project, pIdx) => (
                          <TableRow key={`${collabName}-${pIdx}`} className={pIdx % 2 === 0 ? 'bg-muted/30' : 'bg-background'}>
                            {pIdx === 0 && (
                              <TableCell rowSpan={data.projects.length} className="font-bold align-top border-l">
                                <div>{collabName}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {data.income > 0 && <span className="text-emerald-600 dark:text-emerald-400">₪{data.income.toLocaleString()}</span>}
                                  {data.income > 0 && data.expense > 0 && ' | '}
                                  {data.expense > 0 && <span className="text-destructive">-₪{data.expense.toLocaleString()}</span>}
                                </div>
                              </TableCell>
                            )}
                            <TableCell>{project.name}</TableCell>
                            <TableCell>
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                project.direction === 'income' 
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' 
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              }`}>
                                {project.direction === 'income' ? 'הכנסה' : 'הוצאה'}
                              </span>
                            </TableCell>
                            <TableCell className={`font-semibold ${project.direction === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                              ₪{project.amount.toLocaleString()}
                            </TableCell>
                            <TableCell>{project.date ? new Date(project.date).toLocaleDateString('he-IL') : '-'}</TableCell>
                          </TableRow>
                        ))}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">אין נתונים</div>
            )}
          </CardContent>
        </Card>

        {/* Projects by Year and Collaboration Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              הכנסות פרויקטים ושת״פ לפי שנה וגוף
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projectsByYearCollabData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={projectsByYearCollabData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(v) => `₪${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => [`₪${Number(value).toLocaleString()}`, '']} />
                  <Legend />
                  {allCollabNames.map((name, index) => (
                    <Bar 
                      key={name} 
                      dataKey={name} 
                      name={name} 
                      stackId="a"
                      fill={COLORS[index % COLORS.length]} 
                      radius={index === allCollabNames.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">אין נתונים</div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
