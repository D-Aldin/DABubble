export interface Channel {
  id: string;
  title: string;
  description: string;
  createdBy?: string;
  participants?: string[];
  createdAt?: any;
  members: string[];
  creatorId: string;
}