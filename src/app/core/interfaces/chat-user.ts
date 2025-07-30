export interface ChatUser {
  uid?: string;
  id?: string; // optional Firestore doc ID
  name: string;
  avatarPath: string;
  online: boolean;
  email?: string;
}
