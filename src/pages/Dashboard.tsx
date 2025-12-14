import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/ui/stat-card';
import { LeadCard } from '@/components/leads/LeadCard';
import { StudentCard } from '@/components/students/StudentCard';
import { mockLeads, mockStudents } from '@/data/mockData';
import { UserPlus, GraduationCap, TrendingUp, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const newLeadsCount = mockLeads.filter(l => l.status === 'new' || l.status === 'contacted').length;
  const activeStudentsCount = mockStudents.filter(s => s.status === 'active' || s.status === 'application_phase').length;
  const acceptedCount = mockStudents.filter(s => s.status === 'accepted' || s.status === 'enrolled').length;

  const recentLeads = mockLeads.slice(0, 3);
  const recentStudents = mockStudents.slice(0, 3);

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
            title="לידים חדשים"
            value={newLeadsCount}
            icon={UserPlus}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="סטודנטים פעילים"
            value={activeStudentsCount}
            icon={GraduationCap}
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="התקבלו השנה"
            value={acceptedCount}
            icon={TrendingUp}
            trend={{ value: 25, isPositive: true }}
          />
          <StatCard
            title="ממתינים לטיפול"
            value={2}
            icon={Clock}
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Leads */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">לידים אחרונים</h2>
              <Link to="/leads" className="text-sm text-primary hover:underline">
                הצג הכל
              </Link>
            </div>
            <div className="space-y-4">
              {recentLeads.map((lead, index) => (
                <div key={lead.id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <LeadCard lead={lead} />
                </div>
              ))}
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
                  <StudentCard student={student} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
