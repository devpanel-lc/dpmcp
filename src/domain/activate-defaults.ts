// Generic activation defaults, captured from a real DevPanel UI activate request
// (2026-08-03). Not project-type-aware -- every stack gets the same fallback values
// unless the caller explicitly overrides them. PlanService.activatePlan fills these
// in for any field the caller omitted and records a plan warning when it does, so the
// human approving the plan can catch a mismatched image/capacity/root before it ships.
export const ACTIVATE_GENERIC_DEFAULTS = {
  copyDatabaseFilesType: '',
  isEnablePgDb: false,
  isEnableBasicAuth: false,
  filePermissionLevel: 'stricterPermission',
  containerImage: 'devpanel/php:8.3-base-rc',
  secretManager: '',
  appRoot: '/var/www/html',
  webRoot: '/var/www/html/web',
  capacity: 'micro',
  capacityLimit: 'micro',
  groupType: 'on-demand' as const,
  storage: 5,
  isEnableEditor: false,
  isEnablePMA: false,
};

/** Fields risky enough to warn about when left at the generic default -- getting
 *  these wrong can under-provision the app or run the wrong runtime image. */
export const ACTIVATE_REVIEW_FIELDS = ['containerImage', 'capacity', 'storage', 'appRoot', 'webRoot', 'groupType'] as const;
