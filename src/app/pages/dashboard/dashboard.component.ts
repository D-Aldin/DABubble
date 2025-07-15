import { Component } from '@angular/core';
import { SidenavComponent } from './sidenav/sidenav.component';
import { HeaderComponent } from '../../shared/header/header.component';
import { ThreadComponent } from '../../shared/thread/thread.component';
import { ChatBoxComponent } from '../../shared/chat-box/chat-box.component';
import { MessageFieldComponent } from '../../shared/message-field/message-field.component';
import { RouterModule } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { AddChannelComponent } from '../../shared/add-channel/add-channel.component';
import { AddPeopleComponent } from '../../shared/add-channel/add-people/add-people.component';
import { ChannelService } from '../../core/services/channel.service';
import { Channel } from '../../core/interfaces/channel';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    SidenavComponent,
    HeaderComponent,
    ThreadComponent,
    ChatBoxComponent,
    MessageFieldComponent,
    RouterModule,
    RouterOutlet,
    AddChannelComponent,
    AddPeopleComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  showSidenav = true;
  hovered = false;
  showAddChannelDialog = false;
  showPeopleDialog = false;
  createdChannelName = '';
  channelDataBuffer: Partial<Channel> = {};
  channelName = '';
  channelDescription = '';

  constructor(private channelService: ChannelService) {}

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

  handleProceedToPeople(data: { name: string; description: string }) {
    this.channelDataBuffer = {
      title: data.name,
      description: data.description,
      createdAt: new Date()
    };
    this.closeAddChannelDialog();
    this.openAddPeopleDialog();
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
    }

    this.showAddChannelDialog = false;
    this.showPeopleDialog = true;
  }


  closePeopleDialog() {
  this.createdChannelName = '';
  this.showPeopleDialog = false;
}

 handlePeopleConfirmed(selectedUsers: string[]) {
  const finalChannel = {
    ...this.channelDataBuffer,
    members: selectedUsers,
  } as Channel;

  this.channelService.createChannel(finalChannel).then(() => {
    console.log('Channel created with users:', selectedUsers);
    this.closePeopleDialog();
  });
}


  handleChannelCreation(channelData: Channel) {
    this.channelName = channelData.title;
    this.channelDescription = channelData.description;
    this.openAddPeopleDialog({ name: channelData.title, description: channelData.description });
  }



}
