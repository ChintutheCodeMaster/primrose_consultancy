export type AppRole =
  | 'student'
  | 'consultant'
  | 'parent'
  | 'counselor'
  | 'admin'
  | 'iec_admin'
  | 'principal'
  | 'teacher';

export function destinationFor(role: AppRole | null, next: string | null): string {
  if (next) return next;
  switch (role) {
    case 'iec_admin':
      return '/admin/consultants';
    case 'consultant':
    case 'admin':
      return '/dashboard';
    case 'student':
      return '/student';
    default:
      return '/';
  }
}
