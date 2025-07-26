import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ChatUser } from '../interfaces/chat-user';
import { ProfileCard } from '../interfaces/profile-card';

@Injectable({
  providedIn: 'root'
})
export class ProfileOverlayService {
  private _visible = new BehaviorSubject<boolean>(false);
  private _user = new BehaviorSubject<ProfileCard | null>(null);

  get isVisible$(): Observable<boolean> {
    return this._visible.asObservable();
  }

  get selectedUser$(): Observable<ProfileCard | null> {
    return this._user.asObservable();
  }

  open(user: ProfileCard): void {
    this._user.next(user);
    this._visible.next(true);
  }

  close(): void {
    this._visible.next(false);
    this._user.next(null);
  }

  updatePartial(data: Partial<ProfileCard>): void {
    const current = this._user.getValue();
    if (!current) return;
    this._user.next({ ...current, ...data });
  }
}
