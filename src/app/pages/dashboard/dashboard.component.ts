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

  openAddPeopleDialog() {
    this.showAddChannelDialog = false;
    this.showPeopleDialog = true;
  }

  closePeopleDialog() {
  this.createdChannelName = '';
  this.showPeopleDialog = false;
}

  handlePeopleConfirmed(selectedUsers: any) {
    console.log('Selected users:', selectedUsers);
    this.closePeopleDialog();
    // TODO: Save to Firebase or continue to next step
  }


}
