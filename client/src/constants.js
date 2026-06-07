export const ROLE_LABELS = {
  admin: 'Management Admin',
  senior_manager: 'Senior Manager',
  hr_recruiter: 'HR Recruiter',
  employee: 'Employee',
};

export const MANAGEMENT = ['admin', 'senior_manager'];
export const HR_ACCESS = ['admin', 'senior_manager', 'hr_recruiter'];

// Sidebar navigation, filtered by the current user's role.
export const NAV = [
  { to: '/', label: 'Dashboard', icon: '📊', roles: ['admin', 'senior_manager', 'hr_recruiter', 'employee'] },
  { to: '/employees', label: 'Employees', icon: '👥', roles: HR_ACCESS },
  { to: '/attendance', label: 'Attendance', icon: '🕒', roles: ['admin', 'senior_manager', 'hr_recruiter', 'employee'] },
  { to: '/leave', label: 'Leave', icon: '🌴', roles: ['admin', 'senior_manager', 'hr_recruiter', 'employee'] },
  { to: '/payroll', label: 'Payroll', icon: '💰', roles: ['admin', 'senior_manager', 'employee'] },
  { to: '/performance', label: 'Performance', icon: '📈', roles: ['admin', 'senior_manager', 'employee'] },
  { to: '/recruitment', label: 'Recruitment (AI)', icon: '🤖', roles: HR_ACCESS },
];

export const STAGE_LABELS = {
  applied: 'Applied',
  ai_screened: 'AI Screened',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
  hired: 'Hired',
};

export const REC_COLORS = {
  strong_yes: 'bg-green-100 text-green-700',
  yes: 'bg-emerald-100 text-emerald-700',
  maybe: 'bg-amber-100 text-amber-700',
  no: 'bg-rose-100 text-rose-700',
};
