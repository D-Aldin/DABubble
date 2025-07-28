import { Injectable } from '@angular/core';
import { ProfileCard } from '../interfaces/profile-card';
import { ProfileOverlayService } from './profile-overlay.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class OpenProfileCardService {

  constructor(private overlayService: ProfileOverlayService, private userService: UserService) {
  }


  openProfileCard(userId: string | undefined): void {
      if (!userId) {
        return;
      }
      const initialProfile: ProfileCard = {
        name: '...',
        email: '',
        avatarPath: '',
        online: false,
        direktMessageLink: `/dashboard/direct-message/${userId}`
      };
      this.overlayService.open(initialProfile);
      this.userService.getUserById(userId).subscribe(userDoc => {
        if (!userDoc) return;
        this.overlayService.updatePartial({
          name: userDoc.name,
          email: userDoc.email,
          avatarPath: userDoc.avatarPath,
          online: userDoc.online,
          direktMessageLink: `/dashboard/direct-message/${userId}`
        });
      });
    }
}
