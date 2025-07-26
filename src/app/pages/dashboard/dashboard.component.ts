import { Component, inject, OnInit, EventEmitter, Output } from '@angular/core';
import { SidenavComponent } from './sidenav/sidenav.component';
import { HeaderComponent } from '../../shared/header/header.component';
import { ThreadComponent } from '../../shared/thread/thread.component';
import { ChatBoxComponent } from '../../shared/chat-box/chat-box.component';
import { NavigationEnd, Router, RouterModule, Event } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { AddChannelComponent } from '../../shared/add-channel/add-channel.component';
import { AddPeopleComponent } from '../../shared/add-channel/add-people/add-people.component';
import { ChannelService } from '../../core/services/channel.service';
import { Channel } from '../../core/interfaces/channel';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { ChatUser } from '../../core/interfaces/chat-user';
import { UserService } from '../../core/services/user.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ElementRef, HostListener, ViewChild } from '@angular/core';
import { ThreadMessagingService } from '../../core/services/thread-messaging.service';
import { DashboardIntroComponent } from './dashboard-intro/dashboard-intro.component';
import { filter } from 'rxjs';
import { ProfileCardComponent } from "../../shared/profile-card/profile-card.component";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    SidenavComponent,
    HeaderComponent,
    CommonModule,
    RouterModule,
    RouterOutlet,
    ThreadComponent,
    DashboardIntroComponent,
    ProfileCardComponent
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
  currentUrl: string = ''; // use this to keep track of current URL, which is tracked in onInit()
  showAddUserToChannelPopup = false;
  addUserMode: 'create-channel' | 'add-to-channel' = 'add-to-channel';
  selectedChannelIdForUserAdd: string = '';
  selectedChannelTitleForUserAdd: string = '';
  showThread = false;
  selectedMessageId: string = '';
  selectedChannelId: string = '';
  isIntroSectionVisible: boolean = true;
  @Output() replyToThread = new EventEmitter<string>();

  constructor(
    private channelService: ChannelService,
    private firestore: Firestore,
    private userService: UserService,
    private router: Router,
    private authService: AuthService,
    private threadService: ThreadMessagingService
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
    this.threadService.threadState$.subscribe((state) => {
      if (state) {
        this.selectedMessageId = state.messageId;
        this.selectedChannelId = state.channelId;
        this.showThread = true;
      } else {
        this.selectedMessageId = '';
        this.selectedChannelId = '';
        this.showThread = false;
      }
    });

    this.checkDashboardRouting();
  }

    checkDashboardRouting() {
    this.router.events
      .pipe(
        filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe((event) => {
        this.currentUrl = event.urlAfterRedirects;
        this.isIntroSectionVisible = this.currentUrl === '/dashboard';
      });
  }

  openThread(channelId: string, messageId: string) {
    console.log('Opening thread:', channelId, messageId);
    this.selectedChannelId = channelId;
    this.selectedMessageId = messageId;
    this.showThread = true;
  }

  onCloseThread() {
    this.threadService.closeThread();
  }

  onReplyToMessage(messageId: string) {
    this.replyToThread.emit(messageId);
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
    this.addUserMode = 'create-channel'; //Needed for correct dialog mode
    this.showAddChannelDialog = false;
    this.showPeopleDialog = true;
  }

  closePeopleDialog() {
    this.createdChannelName = '';
    this.showPeopleDialog = false;
  }
}
