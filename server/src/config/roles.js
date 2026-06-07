// Central definition of the multi-role access system.
export const ROLES = {
  ADMIN: 'admin', // Management Admin — full access, company-wide dashboards
  SENIOR_MANAGER: 'senior_manager', // department-level oversight
  HR_RECRUITER: 'hr_recruiter', // recruitment + AI screening
  EMPLOYEE: 'employee', // self-service
};

export const ALL_ROLES = Object.values(ROLES);

// Convenience groupings used by route guards.
export const MANAGEMENT = [ROLES.ADMIN, ROLES.SENIOR_MANAGER];
export const HR_ACCESS = [ROLES.ADMIN, ROLES.SENIOR_MANAGER, ROLES.HR_RECRUITER];
