import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  collection,
  collectionData,
  docData,
} from '@angular/fire/firestore';
import { Observable, combineLatest, BehaviorSubject } from 'rxjs';
import { ChatUser } from '../interfaces/chat-user';
import { updateDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private firestore = inject(Firestore);
  private avatarPathSubject = new BehaviorSubject<string>(
    '/assets/images/register/default-profile-img.svg'
  );
  avatarPath$ = this.avatarPathSubject.asObservable();

  async createUserDocument(
    uid: string,
    avatarPath: string,
    name: string,
    email: string
  ): Promise<void> {
    const userRef = doc(this.firestore, 'users', uid);
    await setDoc(userRef, {
      avatarPath,
      name,
      email,
    });
  }

  async getUserDocument(
    uid: string
  ): Promise<{ avatarPath: string; name: string; email: string } | null> {
    const userRef = doc(this.firestore, 'users', uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as {
        avatarPath: string;
        name: string;
        email: string;
      };
      return data;
    } else {
      console.warn('No such document!');
      return null;
    }
  }

  async setOnlineStatus(uid: string, online: boolean): Promise<void> {
    const userRef = doc(this.firestore, 'users', uid);
    await setDoc(userRef, { online }, { merge: true });
  }

  getAllUsers(): Observable<
    { id: string; avatarPath: string; name: string }[]
  > {
    const usersRef = collection(this.firestore, 'users');
    return collectionData(usersRef, { idField: 'id' }) as Observable<
      { id: string; avatarPath: string; name: string }[]
    >;
  }

  getAllUsersForDropdown(): Observable<
    { id: string; avatarPath: string; name: string; email: string }[]
  > {
    const usersRef = collection(this.firestore, 'users');
    return collectionData(usersRef, { idField: 'id' }) as Observable<
      { id: string; avatarPath: string; name: string; email: string }[]
    >;
  }

  getUsersByIds(ids: string[]): Observable<ChatUser[]> {
    const userRefs = ids.map((id) => doc(this.firestore, 'users', id));
    const userObservables = userRefs.map(
      (ref) => docData(ref, { idField: 'uid' }) as Observable<ChatUser>
    );
    return combineLatest(userObservables);
  }

  getUserById(id: string): Observable<ChatUser> {
    const userRef = doc(this.firestore, 'users', id);
    return docData(userRef, { idField: 'id' }) as Observable<ChatUser>;
  }

  sortUsersWithCurrentFirst(
    users: { id: string; name: string; avatarPath: string }[],
    currentUserId: string
  ): ChatUser[] {
    const chatUsers: ChatUser[] = users.map((u) => ({
      uid: u.id,
      name: u.name,
      avatarPath: u.avatarPath,
      email: '',
      online: false,
    }));

    return chatUsers.sort((a, b) => {
      if (a.uid === currentUserId) return -1;
      if (b.uid === currentUserId) return 1;
      return 0;
    });
  }

  getAllUsersForSidenav(): Observable<ChatUser[]> {
    const usersRef = collection(this.firestore, 'users');
    // idField must match what you use in the template → uid
    return collectionData(usersRef, { idField: 'uid' }) as Observable<ChatUser[]>;
  }

  sortUsersWithCurrentFirstForSidenav(users: ChatUser[], currentUserId: string): ChatUser[] {
    const arr = users.slice(); // new array, no mutation
    return arr.sort((a, b) => (a.uid === currentUserId ? -1 : b.uid === currentUserId ? 1 : 0));
  }

  async updateUserAvatar(uid: string, newAvatarPath: string): Promise<void> {
    const userRef = doc(this.firestore, 'users', uid);
    await setDoc(userRef, { avatarPath: newAvatarPath }, { merge: true });
    this.avatarPathSubject.next(newAvatarPath);
  }

  setInitialAvatar(path: string) {
    this.avatarPathSubject.next(path);
  }
}
