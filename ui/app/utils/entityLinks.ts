/**
 * Entity Links Helper
 * Generates navigation links to OneAgent/host/application details
 */

export function generateEntityLink(entityId: string): string {
  // TODO: Use Dynatrace navigation SDK to generate proper entity links
  return `/ui/apps/dynatrace.classic.hosts/#host;id=${entityId}`;
}

export function generateHostDetailLink(hostName: string): string {
  // TODO: Navigate to host details page
  return `/ui/apps/dynatrace.classic.hosts/#host;filter=${encodeURIComponent(hostName)}`;
}

export function generateApplicationDetailLink(appName: string): string {
  // TODO: Navigate to application details page
  return `/ui/apps/dynatrace.classic.applications/#application;filter=${encodeURIComponent(appName)}`;
}
