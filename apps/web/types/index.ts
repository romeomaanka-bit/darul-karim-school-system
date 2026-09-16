export type Role = "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";

export type SessionUser = {
  id: string;
  email: string | null;
  role: Role;
  student?: { id: string; rollNumber: string; firstName: string; lastName: string; class?: { name: string } | null } | null;
  teacher?: { id: string; firstName: string; lastName: string } | null;
  parent?: { id: string; firstName: string; lastName: string; children?: unknown[] } | null;
};

export type ApiEnvelope<T> = { success: boolean; data: T; message?: string };
export type Paginated<T> = { items: T[]; pagination: { page: number; limit: number; total: number; pages: number } };
export type RecordValue = string | number | boolean | null | undefined | Record<string, unknown> | unknown[];
export type ApiRecord = { id: string; [key: string]: RecordValue };
