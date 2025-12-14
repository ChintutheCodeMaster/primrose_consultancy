import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/ui/stat-card';
import { StudentRow } from '@/components/students/StudentRow';
import { mockLeads, mockStudents } from '@/data/mockData';
import { GraduationCap, AlertTriangle, DollarSign, UserCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { differenceInDays } from 'date-fns';

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Active students count
  const activeStudentsCount = mockStudents.filter(s => 
    s.status !== 'graduated'
  ).length;
  
  // Students needing attention (not signed agreement after 4 days OR not paid after 7 days)
  const studentsNeedingAttention = mockStudents.filter(s => {
    if (s.status === 'graduated') return false;
    const daysSinceCreation = differenceInDays(new Date(), new Date(s.createdAt));
    const needsAgreementReminder = !s.signedAgreement && daysSinceCreation >= 4;
    const needsPaymentReminder = !s.isPaid && daysSinceCreation >= 7;
    return needsAgreementReminder || needsPaymentReminder;
  });
  
  // Total income this month (from paid students)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const totalIncomeThisMonth = mockStudents
    .filter(s => {
      const createdDate = new Date(s.createdAt);
      return s.isPaid && 
             createdDate.getMonth() === currentMonth && 
             createdDate.getFullYear() === currentYear;
    })
    .reduce((sum, s) => sum + s.packageCost, 0);
  
  // Conversions this month (leads that became students)
  const conversionsThisMonth = mockStudents.filter(s => {
    const createdDate = new Date(s.createdAt);
    return createdDate.getMonth() === currentMonth && 
           createdDate.getFullYear() === currentYear;
  }).length;

  const recentStudents = mockStudents
    .filter(s => s.status !== 'graduated')
    .slice(0, 3);

  return (
    <MainLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">שלום! 👋</h1>
          <p className="text-muted-foreground mt-1">הנה סיכום הפעילות שלך</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="סטודנטים פעילים"
            value={activeStudentsCount}
            icon={GraduationCap}
          />
          <div 
            onClick={() => navigate('/students?filter=attention')}
            className="cursor-pointer"
          >
            <StatCard
              title="דורשים תשומת לב"
              value={studentsNeedingAttention.length}
              icon={AlertTriangle}
              className={studentsNeedingAttention.length > 0 ? 'border-warning bg-warning/5' : ''}
            />
          </div>
          <StatCard
            title="הכנסות החודש"
            value={`₪${totalIncomeThisMonth.toLocaleString()}`}
            icon={DollarSign}
          />
          <StatCard
            title="המרות החודש"
            value={conversionsThisMonth}
            icon={UserCheck}
          />
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Students Needing Attention */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                דורשים תשומת לב
              </h2>
              <Link to="/students?filter=attention" className="text-sm text-primary hover:underline">
                הצג הכל
              </Link>
            </div>
            <div className="space-y-4">
              {studentsNeedingAttention.length > 0 ? (
                studentsNeedingAttention.slice(0, 3).map((student, index) => (
                  <div key={student.id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                    <StudentRow student={student} showActions={false} />
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-card rounded-xl border border-border/50">
                  <p className="text-muted-foreground">🎉 אין סטודנטים שדורשים תשומת לב</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Students */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">סטודנטים אחרונים</h2>
              <Link to="/students" className="text-sm text-primary hover:underline">
                הצג הכל
              </Link>
            </div>
            <div className="space-y-4">
              {recentStudents.map((student, index) => (
                <div key={student.id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <StudentRow student={student} showActions={false} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
