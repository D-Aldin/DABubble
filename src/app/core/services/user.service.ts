import { inject, Injectable } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, collection, collectionData, docData } from '@angular/fire/firestore';
import { Observable, combineLatest  } from 'rxjs';
import { ChatUser } from '../interfaces/chat-user';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private firestore = inject(Firestore);

  async createUserDocument(uid: string, avatarPath: string, name: string, email: string): Promise<void> {
    const userRef = doc(this.firestore, 'users', uid);
    await setDoc(userRef, {
      avatarPath, name, email
    });
  }

  async getUserDocument(uid: string): Promise<{ avatarPath: string, name: string, email: string } | null> {
    const userRef = doc(this.firestore, 'users', uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as { avatarPath: string; name: string, email: string };
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

  getAllUsers(): Observable<{ id: string, avatarPath: string, name: string }[]> {
    const usersRef = collection(this.firestore, 'users');
    return collectionData(usersRef, { idField: 'id' }) as Observable<{ id: string, avatarPath: string, name: string }[]>;
  }

  getUsersByIds(ids: string[]): Observable<ChatUser[]> { //to get multiple users
    const userRefs = ids.map(id => doc(this.firestore, 'users', id));
    const userObservables = userRefs.map(ref => docData(ref, { idField: 'id' }) as Observable<ChatUser>);
    return combineLatest(userObservables);
  }

  getUserById(id: string): Observable<ChatUser> { // to get single user
    const userRef = doc(this.firestore, 'users', id);
    return docData(userRef, { idField: 'id' }) as Observable<ChatUser>;
  }


  
}
