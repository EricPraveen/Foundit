/**
 * Backend response DTO from GET /api/v1/locations.
 */
export interface LocationResponse {
  id: string;
  name: string;
  campusZone?: string;
  description?: string;
  active: boolean;
}
