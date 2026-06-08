import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

const formatStudentData = (s: any) => ({
  Name: s.name,
  Email: s.email || '',
  Phone: s.phone,
  Status: s.status,
  'Degree Type': s.degree_type,
  'Field of Interest': s.interested_field || '',
  'Preferred Country': s.interested_country || '',
  'Target Country': s.target_country || '',
  'Target University': s.target_university || '',
  Program: s.program || '',
  'Graduation Year': s.graduation_year || '',
  Source: s.source || '',
  Consultant: s.advisor_name || '',
  'Package Cost': s.package_cost || 0,
  'Amount Paid': s.amount_paid || 0,
  Paid: s.is_paid ? 'Yes' : 'No',
  'Payment Notes': s.payment_notes || '',
  'Agreement Signed': s.signed_agreement ? 'Yes' : 'No',
  'Meeting Summary': s.meeting_summary || '',
  'Accepted Universities': s.accepted_universities?.map((u: any) => u.name).join(', ') || '',
  'Creation Date': s.created_at ? format(new Date(s.created_at), 'dd/MM/yyyy') : '',
});

export async function exportAllDataToExcel(): Promise<string> {
  const { data: leads } = await supabase
    .from('leads').select('*').eq('did_not_continue', false).order('created_at', { ascending: false });
  const { data: leadsDidNotContinue } = await supabase
    .from('leads').select('*').eq('did_not_continue', true).order('created_at', { ascending: false });
  const { data: activeStudents } = await supabase
    .from('students').select('*, accepted_universities(*)').is('graduation_year', null).eq('did_not_continue', false).order('created_at', { ascending: false });
  const { data: pastClients } = await supabase
    .from('students').select('*, accepted_universities(*)').not('graduation_year', 'is', null).eq('did_not_continue', false).order('graduation_year', { ascending: false });
  const { data: studentsDidNotContinue } = await supabase
    .from('students').select('*, accepted_universities(*)').eq('did_not_continue', true).order('created_at', { ascending: false });
  const { data: advisors } = await supabase
    .from('advisors').select('*').order('name', { ascending: true });
  const { data: sidebarCategories } = await supabase
    .from('sidebar_categories').select('*').eq('is_active', true).order('sort_order', { ascending: true });

  const wb = XLSX.utils.book_new();

  const leadCols = (l: any) => ({
    Name: l.name, Email: l.email, Phone: l.phone, Status: l.status,
    'Degree Type': l.degree_type, 'Field of Interest': l.interested_field || '',
    'Preferred Country': l.interested_country || '', Source: l.source || '',
    'Meeting Summary': l.meeting_summary || '',
    'Creation Date': l.created_at ? format(new Date(l.created_at), 'dd/MM/yyyy') : '',
    'Last Contact': l.last_contact_at ? format(new Date(l.last_contact_at), 'dd/MM/yyyy') : '',
  });

  const leadsYears = sidebarCategories?.filter((c) => c.category_type === 'leads') || [];
  if (leadsYears.length > 0) {
    leadsYears.forEach((yc) => {
      const yl = leads?.filter((l) => l.leads_year === yc.year_value) || [];
      if (yl.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(yl.map(leadCols)), `Inquiries ${yc.display_label}`.substring(0, 31));
    });
  } else if (leads?.length) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(leads.map(leadCols)), 'Inquiries');
  }

  if (activeStudents?.length) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(activeStudents.map(formatStudentData)), 'Active Students');
  }

  const pastYears = sidebarCategories?.filter((c) => c.category_type === 'past_clients') || [];
  if (pastYears.length && pastClients?.length) {
    pastYears.forEach((yc) => {
      const yc2 = pastClients.filter((s) => s.graduation_year === yc.year_value);
      if (yc2.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(yc2.map(formatStudentData)), `Past Clients ${yc.display_label}`.substring(0, 31));
    });
  } else if (pastClients?.length) {
    const groups = new Map<string, any[]>();
    pastClients.forEach((s) => {
      const y = s.graduation_year || 'Unknown';
      if (!groups.has(y)) groups.set(y, []);
      groups.get(y)!.push(s);
    });
    groups.forEach((rows, y) => XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.map(formatStudentData)), `Past Clients ${y}`.substring(0, 31)));
  }

  const allDNC = [
    ...(leadsDidNotContinue || []).map((l) => ({ ...l, type: 'lead' })),
    ...(studentsDidNotContinue || []).map((s) => ({ ...s, type: 'student' })),
  ];
  if (allDNC.length) {
    const rows = allDNC.map((i: any) => ({
      Name: i.name, Email: i.email || '', Phone: i.phone,
      Type: i.type === 'lead' ? 'Inquiry' : 'Student',
      'Degree Type': i.degree_type, 'Field of Interest': i.interested_field || '',
      'Preferred Country': i.interested_country || '', Source: i.source || '',
      'Meeting Summary': i.meeting_summary || '',
      'Creation Date': i.created_at ? format(new Date(i.created_at), 'dd/MM/yyyy') : '',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Closed/Lost');
  }

  const advCols = (a: any) => ({
    Name: a.name, Email: a.email || '', Phone: a.phone || '',
    'Payment Type': a.payment_type || '', 'Payment Amount': a.payment_amount || 0,
    'Payment Notes': a.payment_notes || '', Notes: a.notes || '',
  });
  const active = advisors?.filter((a) => a.is_active) || [];
  const former = advisors?.filter((a) => !a.is_active) || [];
  if (active.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(active.map(advCols)), 'Active Consultants');
  if (former.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(former.map(advCols)), 'Former Consultants');

  const fileName = `PrimroseIEC_Data_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return fileName;
}
