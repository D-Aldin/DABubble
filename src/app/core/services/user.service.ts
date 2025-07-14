import { inject, Injectable } from '@angular/core';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private firestore = inject(Firestore);

  async createUserDocument(uid: string, avatarPath: string, name: string): Promise<void> {
    const userRef = doc(this.firestore, 'users', uid);
    await setDoc(userRef, {
      avatarPath, name
    });
  }

  async getUserDocument(uid: string): Promise<{ avatarPath: string, name: string } | null> {
    const userRef = doc(this.firestore, 'users', uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as { avatarPath: string; name: string };
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
}
