import { Component, HostListener } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { AuthService } from '../../core/services/auth.service';
import { ChannelService } from '../../core/services/channel.service';
import { UserService } from '../../core/services/user.service';
import { Channel } from '../../core/interfaces/channel';
import { ChatUser } from '../../core/interfaces/chat-user';
import { ThreadComponent } from "../../shared/thread/thread.component";
import { ChatBoxComponent } from "../../shared/chat-box/chat-box.component";
import { AddChannelComponent } from "../../shared/add-channel/add-channel.component";
import { AddPeopleComponent } from "../../shared/add-channel/add-people/add-people.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-channel',
  standalone: true,
  imports: [ThreadComponent, ChatBoxComponent, AddChannelComponent, AddPeopleComponent, CommonModule],
  templateUrl: './channel.component.html',
  styleUrl: './channel.component.scss',
})
export class ChannelComponent {
  selectedChannelPreviewUsers: ChatUser[] = [];
  selectedChannel: Channel | null = null;
  showChannelOptionsPopup = false;
  creatorName: string = '';
  creatorOnline: boolean = false;

  showSidenav = true;
  hovered = false;
  showAddChannelDialog = false;
  showPeopleDialog = false;
  createdChannelName = '';
  channelDataBuffer: Partial<Channel> = {};
  channelName = '';
  channelDescription = '';
  showAddUserToChannelPopup = false;
  addUserMode: 'create-channel' | 'add-to-channel' = 'add-to-channel';
  selectedChannelIdForUserAdd: string = '';
  selectedChannelTitleForUserAdd: string = '';
  // channelDataBuffer: Partial<Channel> = {};


  constructor(
    private channelService: ChannelService,
    private firestore: Firestore,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) { }

  // ngOnInit(): void {
  //   this.router.events.subscribe(event => {
  //     if (event instanceof NavigationEnd) {
  //       this.currentUrl = event.urlAfterRedirects;
  //       // Clear selectedChannel when navigating to direct-messages
  //       if (this.currentUrl.startsWith('/dashboard/direct-message/')) {
  //         this.selectedChannel = null;
  //       }
  //     }
  //   });
  // }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const channelId = params.get('id');
      if (channelId) {
        this.channelService.getChannelById(channelId).subscribe(channel => {
          this.selectedChannel = channel;

          const previewIds = channel.members.slice(0, 3);
          this.userService.getUsersByIds(previewIds).subscribe(users => {
            this.selectedChannelPreviewUsers = users;
          });

          this.userService.getUserById(channel.creatorId).subscribe(user => {
            this.creatorName = user.name;
            this.creatorOnline = user.online;
          });
        });
      }
    });
  }


  selectChannel(channel: Channel): void {
    this.selectedChannel = channel;
    // Load preview users
    const previewIds = channel.members.slice(0, 3);
    this.userService.getUsersByIds(previewIds).subscribe(users => {
      this.selectedChannelPreviewUsers = users;
    });
    // ✅ Navigate away from /dashboard/direct-messages
    this.router.navigate(['/dashboard']);
  }

  toggleChannelOptionsPopup() {
    this.showChannelOptionsPopup = !this.showChannelOptionsPopup;

    if (this.showChannelOptionsPopup && this.selectedChannel?.creatorId) {
      this.userService.getUserById(this.selectedChannel.creatorId).subscribe(user => {
        this.creatorName = user.name;
        this.creatorOnline = user.online;
      });
    }
  }

  editChannelName() {
    // You can show a dialog or input to change the name
    console.log('Edit channel name');
  }

  editChannelDescription() {
    // You can show a dialog or input to change the description
    console.log('Edit channel description');
  }

  get selectedChannelPreviewMembers(): string[] {
    return this.selectedChannel?.members?.slice(0, 3) || [];
  }

  openAddUserToChannelPopup() {//to add new user to current-channel
    this.showPeopleDialog = true;
    this.showAddUserToChannelPopup = true;
    this.addUserMode = 'add-to-channel';
    this.selectedChannelIdForUserAdd = this.selectedChannel?.id!;
    this.selectedChannelTitleForUserAdd = this.selectedChannel?.title!;
    console.log('Popup opens');
  }

  handleUserAddConfirm(userIds: string[]) {
    this.channelService.addUsersToChannel(this.selectedChannelIdForUserAdd, userIds).then(() => {
      // Merge new user IDs into selectedChannel
      if (this.selectedChannel) {
        this.selectedChannel.members.push(...userIds.filter(id => !this.selectedChannel!.members.includes(id)));
      }
      // Close dialog
      this.showAddUserToChannelPopup = false;
      this.showPeopleDialog = false;
      // Refresh user preview avatars
      const previewIds = this.selectedChannel!.members.slice(0, 3);
      this.userService.getUsersByIds(previewIds).subscribe(users => {
        this.selectedChannelPreviewUsers = users;
      });
    });
  }

  handleUserAddCancel() {
    this.showAddUserToChannelPopup = false;
  }

  openAddChannelDialog() {
    this.showAddChannelDialog = true;
  }

  closeAddChannelDialog() {
    this.createdChannelName = '';
    this.showAddChannelDialog = false;
  }

  closePeopleDialog() {
    this.createdChannelName = '';
    this.showPeopleDialog = false;
  }

  openAddPeopleDialog(data?: { name: string; description: string }) {
    if (data) {
      this.channelName = data.name;
      this.channelDescription = data.description;
      this.createdChannelName = data.name;
    }
    this.addUserMode = 'create-channel'; //Needed for correct dialog mode
    this.showAddChannelDialog = false;
    this.showPeopleDialog = true;
  }

  async handlePeopleConfirmed(selectedUsers: string[]) {
    let finalMembers: string[] = [];

    if (selectedUsers.length === 1 && selectedUsers[0] === 'ALL') {
      const usersSnapshot = await getDocs(collection(this.firestore, 'users'));
      finalMembers = usersSnapshot.docs.map((doc) => doc.id);
    } else {
      finalMembers = selectedUsers;
    }

    const finalChannel = {
      ...this.channelDataBuffer,
      members: finalMembers,
      creatorId: this.authService.currentUserId,
    } as Channel;


    this.channelService.createChannel(finalChannel).then(() => {
      console.log('Channel created with users:', finalMembers);
      this.closePeopleDialog();
    });
  }

  @HostListener('document:click')
  closePopupOnOutsideClick() {
    this.showChannelOptionsPopup = false;
  }

    handleChannelCreation(channelData: Channel) {
    this.channelName = channelData.title;
    this.channelDescription = channelData.description;
    this.createdChannelName = channelData.title;
    this.openAddPeopleDialog({
      name: channelData.title,
      description: channelData.description,
    });
  }

  handleProceedToPeople(data: { name: string; description: string }) {
    this.channelDataBuffer = {
      title: data.name,
      description: data.description,
      createdAt: new Date(),
    };
    this.createdChannelName = data.name;
    this.closeAddChannelDialog();
    this.openAddPeopleDialog({
      name: data.name,
      description: data.description,
    });

  }
}
