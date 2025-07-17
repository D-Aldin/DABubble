import { Component, inject, OnInit } from '@angular/core';
import { SidenavComponent } from './sidenav/sidenav.component';
import { HeaderComponent } from '../../shared/header/header.component';
import { ThreadComponent } from '../../shared/thread/thread.component';
import { ChatBoxComponent } from '../../shared/chat-box/chat-box.component';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { AddChannelComponent } from '../../shared/add-channel/add-channel.component';
import { AddPeopleComponent } from '../../shared/add-channel/add-people/add-people.component';
import { ChannelService } from '../../core/services/channel.service';
import { Channel } from '../../core/interfaces/channel';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { ChatUser } from '../../core/interfaces/chat-user';
import { UserService } from '../../core/services/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    SidenavComponent,
    HeaderComponent,
    ThreadComponent,
    ChatBoxComponent,
    CommonModule,
    RouterModule,
    RouterOutlet,
    AddChannelComponent,
    AddPeopleComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  showSidenav = true;
  hovered = false;
  showAddChannelDialog = false;
  showPeopleDialog = false;
  createdChannelName = '';
  channelDataBuffer: Partial<Channel> = {};
  channelName = '';
  channelDescription = '';
  selectedChannel: Channel | null = null;
  selectedChannelPreviewUsers: ChatUser[] = [];
  currentUrl: string = ''; // use this to keep track of current URL, which is tracked in onInit()


  constructor(
    private channelService: ChannelService,
    private firestore: Firestore,
    private userService: UserService,
    private router: Router
  ) { }

  chatMessages = [
    {
      src: './../../../assets/images/profile-images/head-1.png',
      userName: 'Muzammal',
      time: '12:12 Uhr',
      message: 'first msg',
      userMe: false,
    },
    {
      src: './../../../assets/images/profile-images/head-1.png',
      userName: 'Muzammal',
      time: '12:12 Uhr',
      message: 'Hello World',
      userMe: true,
    },
    {
      src: './../../../assets/images/profile-images/head-1.png',
      userName: 'Shardzhil',
      time: '12:12 Uhr',
      message: 'Welcome',
      userMe: false,
    },
  ];

  ngOnInit(): void {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentUrl = event.urlAfterRedirects;
        console.log(this.currentUrl);

        // ✅ Clear selectedChannel when navigating to direct-messages
        if (this.currentUrl.startsWith('/dashboard/direct-message/')) {
          this.selectedChannel = null;
        }
      }
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



  get selectedChannelPreviewMembers(): string[] {
    return this.selectedChannel?.members?.slice(0, 3) || [];
  }


  toggleSidenav() {
    this.showSidenav = !this.showSidenav;
  }

  openAddChannelDialog() {
    this.showAddChannelDialog = true;
  }

  closeAddChannelDialog() {
    this.createdChannelName = '';
    this.showAddChannelDialog = false;
  }

  openAddPeopleDialog(data?: { name: string; description: string }) {
    if (data) {
      this.channelName = data.name;
      this.channelDescription = data.description;
      this.createdChannelName = data.name;
    }

    this.showAddChannelDialog = false;
    this.showPeopleDialog = true;
  }

  closePeopleDialog() {
    this.createdChannelName = '';
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
    } as Channel;

    this.channelService.createChannel(finalChannel).then(() => {
      console.log('Channel created with users:', finalMembers);
      this.closePeopleDialog();
    });
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
}
