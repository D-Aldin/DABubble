import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { AuthService } from '../../core/services/auth.service';
import { ChannelService } from '../../core/services/channel.service';
import { UserService } from '../../core/services/user.service';
import { Channel } from '../../core/interfaces/channel';
import { ChatUser } from '../../core/interfaces/chat-user';
import { ThreadComponent } from "../../shared/thread/thread.component";
import { AddPeopleComponent } from "../../shared/add-channel/add-people/add-people.component";
import { CommonModule } from '@angular/common';
import { MessageFieldComponent } from "../../shared/message-field/message-field.component";
import { SpinnerComponent } from "../../shared/spinner/spinner.component";
import { FormsModule } from '@angular/forms';
import { ChannelMessagesComponent } from '../../shared/channel-messages/channel-messages.component';
import { ThreadMessagingService } from '../../core/services/thread-messaging.service';
import { ProfileOverlayService } from '../../core/services/profile-overlay.service';
import { OpenProfileCardService } from '../../core/services/open-profile-card.service';
import { AfterViewInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-channel',
  standalone: true,
  imports: [
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
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.handleRouteParamChanges();
    this.listenToAddChannelDialogTrigger();
  }

   safeUrl(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  private handleRouteParamChanges(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadChannelData(id);
      }
    });
  }

  private loadChannelData(channelId: string): void {
    this.channelId = channelId;
    this.selectedChannelId = channelId;
    this.isLoadingChannel = true;
    this.channelService.getChannelById(channelId).subscribe(channel => {
      if (!channel) {
        this.isLoadingChannel = false;
        return;
      }
      this.selectedChannel = channel;
      this.selectedChannel.members ||= [];
      this.loadChannelUsers(channel);
      this.loadChannelCreator(channel.creatorId);
      this.isLoadingChannel = false;
    });
  }

  private loadChannelUsers(channel: Channel): void {
    const previewIds = channel.members.slice(0, 3);
    this.userService.getUsersByIds(previewIds).subscribe(users => {
      this.selectedChannelPreviewUsers = users.filter(u => !!u);
    });

    this.userService.getUsersByIds(channel.members).subscribe(users => {
      const currentUserId = this.authService.currentUserId;
      users.sort((a, b) => (a.id === currentUserId ? -1 : b.id === currentUserId ? 1 : 0));
      this.fullChannelMembers = users;
    });
  }

  private loadChannelCreator(creatorId: string): void {
    this.userService.getUserById(creatorId).subscribe(user => {
      this.creatorName = user.name;
      this.creatorOnline = user.online;
    });
  }

  private listenToAddChannelDialogTrigger(): void {
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
        }, 300);
      }
    });
  }

  leaveChannel(): void {
    if (!this.canLeaveChannel()) return;
    const updatedMembers = this.getUpdatedMemberList();
    this.channelService.updateChannel(this.selectedChannel!.id, {
      members: updatedMembers
    }).then(() => {
      this.redirectAfterLeaving();
    }).catch(this.handleLeaveChannelError);
  }

  private canLeaveChannel(): boolean {
    const currentUserId = this.authService.currentUserId;

    if (!this.selectedChannel || !currentUserId) return false;

    const isMember = this.selectedChannel.members.includes(currentUserId);
    if (!isMember) {
      console.warn('User is not a member of this channel.');
    }

    return isMember;
  }

  private getUpdatedMemberList(): string[] {
    const currentUserId = this.authService.currentUserId;
    return this.selectedChannel!.members.filter(id => id !== currentUserId);
  }

  private redirectAfterLeaving(): void {
    this.router.navigate(['/dashboard']);
  }

  private handleLeaveChannelError = (err: any): void => {
    console.error('Failed to leave channel:', err);
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
    const previewIds = channel.members.slice(0, 3);
    this.userService.getUsersByIds(previewIds).subscribe(users => {
      this.selectedChannelPreviewUsers = users;
    });
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

  get selectedChannelPreviewMembers(): string[] {
    return this.selectedChannel?.members?.slice(0, 3) || [];
  }

  openAddUserToChannelPopup() {
    this.showPeopleDialog = true;
    this.showAddUserToChannelPopup = true;
    this.addUserMode = 'add-to-channel';
    this.selectedChannelIdForUserAdd = this.selectedChannel?.id!;
    this.selectedChannelTitleForUserAdd = this.selectedChannel?.title!;
  }

  handleUserAddConfirm(userIds: string[]): void {
    this.channelService
      .addUsersToChannel(this.selectedChannelIdForUserAdd, userIds)
      .then(() => this.finalizeUserAdd(userIds));
  }

  private finalizeUserAdd(userIds: string[]): void {
    this.mergeNewMembers(userIds);
    this.closeUserAddDialogs();
    this.refreshChannelPreviewAvatars();
  }

  private mergeNewMembers(userIds: string[]): void {
    if (!this.selectedChannel) return;
    const newIds = userIds.filter(id => !this.selectedChannel!.members.includes(id));
    this.selectedChannel.members.push(...newIds);
  }

  private closeUserAddDialogs(): void {
    this.showAddUserToChannelPopup = false;
    this.showPeopleDialog = false;
    this.showPeopleDialogOnChannelCreation = false;
  }

  private refreshChannelPreviewAvatars(): void {
    const previewIds = this.selectedChannel!.members.slice(0, 3);
    this.userService.getUsersByIds(previewIds).subscribe(users => {
      this.selectedChannelPreviewUsers = users;
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
    this.addUserMode = 'create-channel';
    this.showAddChannelDialog = false;
    this.showPeopleDialog = true;
  }

  async handlePeopleConfirmed(selectedUsers: string[]): Promise<void> {
    const members = await this.resolveFinalMembers(selectedUsers);
    const channel = this.buildNewChannel(members);

    this.channelService.createChannel(channel).then(() => {
      this.closePeopleDialog();
    });
  }

  private async resolveFinalMembers(selectedUsers: string[]): Promise<string[]> {
    if (selectedUsers.length === 1 && selectedUsers[0] === 'ALL') {
      const usersSnapshot = await getDocs(collection(this.firestore, 'users'));
      return usersSnapshot.docs.map(doc => doc.id);
    }

    return selectedUsers;
  }

  private buildNewChannel(members: string[]): Channel {
    return {
      ...this.channelDataBuffer,
      members,
      creatorId: this.authService.currentUserId,
    } as Channel;
  }

  @HostListener('document:click')
  closePopupOnOutsideClick() {
    this.showChannelOptionsPopup = false;
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
