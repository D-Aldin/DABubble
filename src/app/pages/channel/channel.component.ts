import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { AuthService } from '../../core/services/auth.service';
import { ChannelService } from '../../core/services/channel.service';
import { UserService } from '../../core/services/user.service';
import { Channel } from '../../core/interfaces/channel';
import { ChatUser } from '../../core/interfaces/chat-user';
import { ThreadComponent } from "../../shared/thread/thread.component";
import { AddChannelComponent } from "../../shared/add-channel/add-channel.component";
import { AddPeopleComponent } from "../../shared/add-channel/add-people/add-people.component";
import { CommonModule } from '@angular/common';
import { MessageFieldComponent } from "../../shared/message-field/message-field.component";
import { SpinnerComponent } from "../../shared/spinner/spinner.component";
import { FormsModule } from '@angular/forms';
import { ChannelMessagesComponent } from '../../shared/channel-messages/channel-messages.component';
import { ThreadMessagingService } from '../../core/services/thread-messaging.service';
import { ProfileOverlayService } from '../../core/services/profile-overlay.service';
import { ProfileCard } from '../../core/interfaces/profile-card';
import { OpenProfileCardService } from '../../core/services/open-profile-card.service';
import { AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-channel',
  standalone: true,
  imports: [
    AddChannelComponent,
    AddPeopleComponent,
    CommonModule,
    MessageFieldComponent,
    SpinnerComponent,
    FormsModule,
    ThreadComponent,
    ChannelMessagesComponent,
    RouterModule],
  templateUrl: './channel.component.html',
  styleUrl: './channel.component.scss',
})
export class ChannelComponent implements OnInit, AfterViewInit {
  selectedChannelPreviewUsers: ChatUser[] = [];
  selectedChannel: undefined | Channel = undefined;
  showChannelOptionsPopup = false;
  creatorName: string = '';
  creatorOnline: boolean = false;
  isLoadingChannel: boolean = true
  showSidenav = true;
  hovered = false;
  showAddChannelDialog = false;
  showAddChannelDialogOnChannelCreation: boolean = false
  showPeopleDialogOnChannelCreation: boolean = false
  showPeopleDialog = false;
  createdChannelName = '';
  channelDataBuffer: Partial<Channel> = {};
  channelName = '';
  channelDescription = '';
  showAddUserToChannelPopup = false;
  addUserMode: 'create-channel' | 'add-to-channel' = 'add-to-channel';
  selectedChannelIdForUserAdd: string = '';
  selectedChannelTitleForUserAdd: string = '';
  isEditingChannelName = false;
  isEditingDescription = false;
  editedChannelName = '';
  editedDescription = '';
  openedThreadMessageId: string | null = null;
  selectedChannelId!: string;
  showChannelMemberPopup = false;
  fullChannelMembers: ChatUser[] = [];
  channelId: string = '';
  showProfileCard$ = this.overlayService.isVisible$;
  selectedUser$ = this.overlayService.selectedUser$;

  constructor(
    private channelService: ChannelService,
    private firestore: Firestore,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    public authService: AuthService,
    private threadService: ThreadMessagingService,
    public overlayService: ProfileOverlayService,
    private openCardService: OpenProfileCardService,
    
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id'); // NOT 'channelId'!
      if (id) {
        this.channelId = id;
        this.selectedChannelId = id;
        this.isLoadingChannel = true;
        this.channelService.getChannelById(id).subscribe(channel => {
          if (!channel) {
            console.warn('Channel not found in Firestore for ID:', id);
            this.isLoadingChannel = false;
            return;
          }
          // console.log('Channel loaded:', channel);
          this.selectedChannel = channel;
          this.selectedChannel.members ||= [];

          // Load preview users (first 3)
          const previewIds = channel.members.slice(0, 3);
          this.userService.getUsersByIds(previewIds).subscribe(users => {
            this.selectedChannelPreviewUsers = users.filter(u => !!u);
          });

          // Load full member list with current user on top
          this.userService.getUsersByIds(channel.members).subscribe(users => {
            const currentUserId = this.authService.currentUserId;
            users.sort((a, b) => {
              if (a.id === currentUserId) return -1;
              if (b.id === currentUserId) return 1;
              return 0;
            });
            this.fullChannelMembers = users;
          });

          // Load creator info
          this.userService.getUserById(channel.creatorId).subscribe(user => {
            this.creatorName = user.name;
            this.creatorOnline = user.online;
          });

          this.isLoadingChannel = false;
        });
      }
    });

    // Watch for global request to open "Add Channel" dialog
    this.channelService.openAddChannelDialog$.subscribe(() => {
      this.showAddChannelDialog = true;
    });
  }

    ngAfterViewInit() {
    this.route.queryParams.subscribe(params => {
      const highlightId = params['highlight'];
      if (highlightId) {
        setTimeout(() => {
          const el = document.getElementById(`msg-${highlightId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('highlight');
          }
        }, 300); // Delay to ensure messages are rendered
      }});
    }

  leaveChannel() {
    const currentUserId = this.authService.currentUserId;

    if (!this.selectedChannel || !currentUserId) return;
    if (!this.selectedChannel.members.includes(currentUserId)) { // Check if user is in the channel
      console.warn('User is not a member of this channel.');
      return;
    }
    // Remove user from members
    const updatedMembers = this.selectedChannel.members.filter(id => id !== currentUserId);

    this.channelService.updateChannel(this.selectedChannel.id, {
      members: updatedMembers
    }).then(() => {
      // Optionally reset state or show toast here
      this.router.navigate(['/dashboard']); // or redirect elsewhere
    }).catch(err => {
      console.error('Failed to leave channel:', err);
    });
  }

  handleOpenAddUserFromPopup() {
    this.showChannelMemberPopup = false;
    this.openAddUserToChannelPopup();
  }

  openThread(channelId: string, messageId: string) {
    this.threadService.openThread(channelId, messageId, 'channel');
  }

  onReplyToMessage(messageId: string) {
    if (!this.channelId) {
      console.warn('Missing channelId in channel component');
      return;
    }

    this.threadService.openThread(this.channelId, messageId, 'channel');

    this.router.navigate([], {
      queryParams: { thread: messageId },
      queryParamsHandling: 'merge'
    });
  }

  closeThread() {
    this.openedThreadMessageId = null;
  }

  saveChannelName() {
    if (this.selectedChannel && this.editedChannelName.trim()) {
      this.channelService
        .updateChannel(this.selectedChannel.id, { title: this.editedChannelName.trim() })
        .then(() => {
          this.selectedChannel!.title = this.editedChannelName.trim();
          this.isEditingChannelName = false;
        });
    }
  }

  cancelEditChannelName() {
    this.isEditingChannelName = false;
    this.editedChannelName = this.selectedChannel?.title || '';
  }

  saveChannelDescription() {
    if (this.selectedChannel && this.editedDescription.trim()) {
      this.channelService
        .updateChannel(this.selectedChannel.id, { description: this.editedDescription.trim() })
        .then(() => {
          this.selectedChannel!.description = this.editedDescription.trim();
          this.isEditingDescription = false;
        });
    }
  }

  cancelEditDescription() {
    this.isEditingDescription = false;
    this.editedDescription = this.selectedChannel?.description || '';
  }


  selectChannel(channel: Channel): void {
    this.selectedChannel = channel;
    // Load preview users
    const previewIds = channel.members.slice(0, 3);
    this.userService.getUsersByIds(previewIds).subscribe(users => {
      this.selectedChannelPreviewUsers = users;
    });
    // ✅ Navigate away from /dashboard/direct-messages
    // this.router.navigate(['/dashboard']);
  }

  toggleChannelOptionsPopup() {
    this.showChannelOptionsPopup = !this.showChannelOptionsPopup;

    if (this.showChannelOptionsPopup && this.selectedChannel) {
      this.editedChannelName = this.selectedChannel.title;
      this.editedDescription = this.selectedChannel.description;

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
      this.showPeopleDialogOnChannelCreation = false;
      // Refresh user preview avatars
      const previewIds = this.selectedChannel!.members.slice(0, 3);
      this.userService.getUsersByIds(previewIds).subscribe(users => {
        this.selectedChannelPreviewUsers = users;
      });
    });
  }

  handleUserAddCancel() {
    this.showPeopleDialog = false;
    this.showAddUserToChannelPopup = false;
  }

  openAddChannelDialog() {
    this.showAddChannelDialog = true;
  }

  closeAddChannelDialog() {
    this.createdChannelName = '';
    this.showAddChannelDialog = false;
  }

  closePeopleDialogOnChannelCreation() {
    this.showPeopleDialogOnChannelCreation = false
  }

  closePeopleDialog() {
    this.createdChannelName = '';
    this.showPeopleDialog = false;
    this.showPeopleDialogOnChannelCreation = false;
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

  openAddPeopleDialogOnChannelCreation(data?: { name: string; description: string }) {
    if (data) {
      this.channelName = data.name;
      this.channelDescription = data.description;
      this.createdChannelName = data.name;
    }
    this.addUserMode = 'create-channel'; //Needed for correct dialog mode
    this.showAddChannelDialog = false;
    this.showPeopleDialogOnChannelCreation = true;
    this.showPeopleDialog = false;
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

  handleProceedToPeopleOnChannelCreation(data: { name: string; description: string }) {
    this.channelDataBuffer = {
      title: data.name,
      description: data.description,
      createdAt: new Date(),
    };
    this.createdChannelName = data.name;
    this.closeAddChannelDialog();
    this.openAddPeopleDialogOnChannelCreation({
      name: data.name,
      description: data.description,
    });

  }

  handleSendChannelMessage(messageText: string) {
    const senderId = this.authService.getCurrentUser()?.uid;
    if (this.selectedChannelId && senderId && messageText.trim()) {
      this.channelService.sendChannelMessage(this.selectedChannelId, senderId, messageText.trim());
    }
  }

  onAddPeopleCancel() {
    if (this.addUserMode === 'add-to-channel') {
      this.handleUserAddCancel();
    } else {
      this.closePeopleDialog();
    }
  }

  closeProfileCard(): void {
    this.overlayService.close();
  }

  openProfileCard(userId: string | undefined): void {
    this.openCardService.openProfileCard(userId)
  }
}
