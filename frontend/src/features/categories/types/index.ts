/**
 * Backend response DTO from GET /api/v1/categories.
 */
export interface CategoryResponse {
  id: string;
  name: string;
  description: string;
  active: boolean;
}
