export type ServiceRequestStatus = 'abierto' | 'proceso' | 'cerrado';

export type ServiceRequestRecord = {
  id: string;
  client: { id: string; name: string };
  service: { id: string; name: string };
  description: string | null;
  status: ServiceRequestStatus;
  createdAt: string;
  updatedAt: string | null;
  reviewedBy: { id: string; name: string } | null;
  reviewedAt: string | null;
  notes: string | null;
};
