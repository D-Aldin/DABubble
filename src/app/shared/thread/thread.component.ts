import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { MessageFieldComponent } from '../message-field/message-field.component';
import { Firestore, collection, addDoc, query, orderBy, onSnapshot, doc, getDoc, updateDoc, runTransaction  } from '@angular/fire/firestore';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ThreadMessagingService } from '../../core/services/thread-messaging.service';
import { ChannelService } from '../../core/services/channel.service';
import { ThreadState } from '../../core/interfaces/thread-state';
import { DirectMessagingService } from '../../core/services/direct-messaging.service';
import { ProfileCard } from '../../core/interfaces/profile-card';
import { ProfileOverlayService } from '../../core/services/profile-overlay.service';
import { ParseTagsPipe } from '../../core/pipes/tag-parser.pipe';
import { User } from '../../core/interfaces/user';
import { Channel } from '../../core/interfaces/channel';
import { MentioningService } from '../../core/services/mentioning.service';

type ReactionEntry = { emoji: string; users: string[]; count: number };

@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [CommonModule, FormsModule, PickerModule, MessageFieldComponent, ParseTagsPipe],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss',
})
export class ThreadComponent {
  isClose: boolean = false;
  message: string = '';
  emojiPicker: boolean = false;
  replies: any[] = [];
  messageText: string = '';
  userMap: { [userId: string]: { name: string, avatarPath: string } } = {};
  parentMessage: any = null;
  channelName: string = '';
  selectedChannelUsers: { name: string; avatarPath: string }[] = [];
  currentUserId: string = '';
  hoveredMessageId: string | null = null;
  editingMessageId: string | null = null;
  editedMessageText: string = '';
  emojiPickerForMessageId: string | null = null;
  threadType: 'channel' | 'direct' = 'channel';
  users: User[] = [];
  channels: Channel[] = [];
  @Input() messageId!: string;
  @Input() channelId!: string;
  @Output() closeThread = new EventEmitter<void>();
  maxVisibleReactions = 3;
  openReactionsPopoverFor: string | null = null;

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private userService: UserService,
    private threadService: ThreadMessagingService,
    private cdr: ChangeDetectorRef,
    private channelService: ChannelService,
    private directMessagingService: DirectMessagingService,
    private overlayService: ProfileOverlayService,
    private mentioningService: MentioningService
  ) {
    this.userService.getAllUsers().subscribe((user: User[]) => {
      this.users = user;
    });
    this.channelService.getChannels().subscribe((channels: Channel[]) => {
      this.channels = channels;
    });
  }

  ngOnInit(): void {
    this.threadService.threadState$.subscribe((thread: ThreadState | null) => {
      if (!this.isValidThread(thread)) return;
      this.setupThreadContext(thread);
      this.loadThreadMessages(thread.channelId, thread.messageId, thread.threadType);
      if (thread.threadType === 'channel') {
        this.loadChannelContext(thread.channelId, thread.messageId);
      } else {
        this.loadDirectParentMessage(thread.channelId, thread.messageId);
      }
    });
  }

  private buildEntries(raw: any): ReactionEntry[] {
    const groups = this.normalizeToNew(raw);
    return Object.entries(groups)
      .map(([emoji, users]) => ({ emoji, users: users as string[], count: (users as string[]).length }))
      .sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji));
  }

  getVisibleReactionsReply(r: any): ReactionEntry[] {
    return this.buildEntries(r.reactions).slice(0, this.maxVisibleReactions);
  }

  getHiddenReactionsReply(r: any): ReactionEntry[] {
    return this.buildEntries(r.reactions).slice(this.maxVisibleReactions);
  }

  getHiddenCountReply(r: any): number {
    return Math.max(0, this.buildEntries(r.reactions).length - this.maxVisibleReactions);
  }

  toggleReactionsPopover(messageId: string): void {
    this.openReactionsPopoverFor =
      this.openReactionsPopoverFor === messageId ? null : messageId;
  }

  getReactionTooltip(emoji: string, userIds: string[]): string {
    const names = userIds.map(id => this.getUserName(id)).filter(Boolean);
    const verb = names.length > 1 ? 'haben reagiert' : 'hat reagiert';
    return `${emoji} ${names.join(', ')} ${verb}`;
  }

  private normalizeToNew(raw?: any): Record<string, string[]> {
    const out: Record<string, string[]> = {};
    if (!raw) return out;
    const ks = Object.keys(raw); if (!ks.length) return out;
    const legacy = typeof (raw as any)[ks[0]] === 'string';
    if (legacy) { for (const uid of ks) (out[(raw as any)[uid]] ||= []).push(uid); return out; }
    for (const e of ks) {
      const v = (raw as any)[e];
      out[e] = Array.isArray(v)
        ? Array.from(new Set((v as any[]).filter((x: any): x is string => typeof x === 'string')))
        : [];
    }
    return out;
  }

  private countUserDistinct(m: Record<string, string[]>, uid: string): number {
    return Object.values(m).reduce((n, list) => n + (list.includes(uid) ? 1 : 0), 0);
  }

  private toggleEmojiForUser(m: Record<string, string[]>, e: string, uid: string, max = 20): void {
    const set = new Set(m[e] ?? []);
    if (set.has(uid)) { set.delete(uid); const next = [...set]; next.length ? m[e] = next : delete m[e]; return; }
    if (this.countUserDistinct(m, uid) >= max) throw new Error('REACTION_LIMIT_REACHED');
    set.add(uid); m[e] = [...set];
  }

  private buildThreadReplyPath(t: ThreadState, replyId: string): string {
    return t.threadType === 'channel'
      ? `channels/${t.channelId}/messages/${t.messageId}/threads/${replyId}`
      : `directMessages/${t.channelId}/messages/${t.messageId}/threads/${replyId}`;
  }

  private isValidThread(thread: ThreadState | null): thread is ThreadState {
    return !!thread?.channelId && !!thread?.messageId;
  }

  private setupThreadContext(thread: ThreadState): void {
    this.channelId = thread.channelId;
    this.messageId = thread.messageId;
    this.threadType = thread.threadType;
    this.currentUserId = this.authService.currentUserId;
  }

  private loadChannelContext(channelId: string, messageId: string): void {
    this.loadChannelUsers(channelId);
    this.loadChannelName(channelId);
    this.loadParentMessage(channelId, messageId);
  }

  ngAfterViewInit() {
    this.initializeMentioningHandlers();
  }

  loadDirectThreadMessages(conversationId: string, messageId: string) {
    const threadCollection = collection(
      this.firestore,
      `directMessages/${conversationId}/messages/${messageId}/threads`
    );
    const q = query(threadCollection, orderBy('timestamp', 'asc'));
    onSnapshot(q, snapshot => {
      this.replies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (this.replies.length && this.parentMessage?.senderId) {
        this.loadUserProfilesForThread();
      }
    });
  }

  loadDirectParentMessage(conversationId: string, messageId: string) {
    const parentRef = doc(
      this.firestore,
      `directMessages/${conversationId}/messages/${messageId}`
    );
    getDoc(parentRef).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        this.parentMessage = {
          id: snap.id,
          ...data,
          senderId: data['senderId'] || data['messageFrom'],
          text: data['text'] || data['message'] || ''
        };
        this.loadUserProfilesForThread(); 
      }
    });
  }

  async sendDirectThreadMessage(text: string) {
    if (!text.trim()) return;
    if (!this.channelId || !this.messageId) {
      console.warn('Missing conversationId or messageId for direct thread');
      return;
    }
    const currentUser = await this.authService.getCurrentUser();
    if (!currentUser) {
      console.error('User not authenticated');
      return;
    }
    const threadCollection = collection(
      this.firestore,
      `directMessages/${this.channelId}/messages/${this.messageId}/threads`
    );
    try {
      await addDoc(threadCollection, {
        text: text.trim(),
        senderId: currentUser.uid,
        timestamp: new Date()
      });
      const parentDocRef = doc(
        this.firestore,
        `directMessages/${this.channelId}/messages/${this.messageId}`
      );
      const parentSnap = await getDoc(parentDocRef);
      const replyCount = ((parentSnap.data() || {})['replyCount'] || 0) + 1;

      await updateDoc(parentDocRef, {
        replyCount,
        lastReplyTimestamp: new Date()
      });
    } catch (error) {
      console.error('❌ Error saving direct thread reply:', error);
    }
  }

  startEditingThread(message: any) {
    this.editingMessageId = message.id;
    this.editedMessageText = message.text;
  }

  getReactionArray(reactions: { [userId: string]: string }) {
    const countMap = new Map<string, number>();

    for (const emoji of Object.values(reactions || {})) {
      countMap.set(emoji, (countMap.get(emoji) || 0) + 1);
    }
    return Array.from(countMap.entries()).map(([emoji, count]) => ({ emoji, count }));
  }

  selectEmojiForMessage(messageId: string) {
    this.emojiPickerForMessageId = this.emojiPickerForMessageId === messageId ? null : messageId;
  }

  async addEmojiToMessage(ev: any, replyId: string) {
    const t = this.threadService.getCurrentThread(); if (!t?.channelId || !t?.messageId) return;
    const emoji = ev.emoji.native, ref = doc(this.firestore, this.buildThreadReplyPath(t, replyId));
    try {
      await runTransaction(this.firestore, async tx => {
        const snap = await tx.get(ref); if (!snap.exists()) return;
        const map = this.normalizeToNew(snap.data()['reactions']);
        this.toggleEmojiForUser(map, emoji, this.authService.currentUserId, 20);
        tx.update(ref, { reactions: map });
      });
    } catch (e: any) {
      if (e?.message === 'REACTION_LIMIT_REACHED') console.warn('Maximal 20 Emojis pro Nachricht und Nutzer.');
      else console.error(e);
    } finally { this.emojiPickerForMessageId = null; }
  }

  cancelEditing() {
    this.editingMessageId = null;
    this.editedMessageText = '';
  }

  async saveEditedMessage(messageId: string) {
    const thread = this.threadService.getCurrentThread();
    if (!thread?.channelId || !thread?.messageId || !thread.threadType) {
      console.warn('Missing thread context');
      return;
    }
    const { channelId, messageId: parentId, threadType } = thread;
    const basePath =
      threadType === 'channel'
        ? `channels/${channelId}/messages/${parentId}/threads/${messageId}`
        : `directMessages/${channelId}/messages/${parentId}/threads/${messageId}`;
    const threadReplyRef = doc(this.firestore, basePath);

    try {
      const snap = await getDoc(threadReplyRef);
      if (!snap.exists()) {
        console.warn('Thread reply not found at', basePath);
        return;
      }
      await updateDoc(threadReplyRef, { text: this.editedMessageText.trim() });
      console.log(' Thread reply updated:', this.editedMessageText);
      this.cancelEditing();
    } catch (error) {
      console.error('Error updating thread reply:', error);
    }
  }

  loadChannelUsers(channelId: string) {
    const channelRef = doc(this.firestore, `channels/${channelId}`);
    getDoc(channelRef).then(async (snap) => {
      if (snap.exists()) {
        const userIds: string[] = snap.data()['members'] || [];

        const users = await this.userService.getUsersByIds(userIds).toPromise();
        if (users) {
          this.selectedChannelUsers = users.map(user => ({
            name: user.name,
            avatarPath: user.avatarPath || 'assets/images/default-avatar.png'
          }));
        }
      }
    });
  }

  loadChannelName(channelId: string) {
    const channelRef = doc(this.firestore, `channels/${channelId}`);
    getDoc(channelRef).then(snap => {
      if (snap.exists()) {
        this.channelName = snap.data()['title'] || channelId;
      }
    });
  }

  loadThreadMessages(channelId: string, messageId: string, threadType: 'channel' | 'direct') {
    const basePath = threadType === 'direct'
      ? `directMessages/${channelId}/messages/${messageId}/threads`
      : `channels/${channelId}/messages/${messageId}/threads`;
    const threadCollection = collection(this.firestore, basePath);
    const q = query(threadCollection, orderBy('timestamp', 'asc'));
    onSnapshot(q, snapshot => {
      this.replies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (this.replies.length && this.parentMessage?.senderId) {
        this.loadUserProfilesForThread();
      }
    });
  }


  loadParentMessage(channelId: string, messageId: string) {
    const parentRef = doc(this.firestore, `channels/${channelId}/messages/${messageId}`);
    getDoc(parentRef).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        this.parentMessage = {
          id: snap.id,
          ...data,
          senderId: data['senderId'] || data['messageFrom']
        };
        this.loadUserProfilesForThread();
      }
    });
  }

  loadUserProfilesForThread() {
    const senderIds = new Set(this.replies.map(r => r.senderId));
    if (this.parentMessage?.senderId) senderIds.add(this.parentMessage.senderId);

    const parentReactors = this.reactorIdsFrom(this.parentMessage?.reactions);
    const replyReactors = this.replies.flatMap(r => this.reactorIdsFrom(r.reactions));

    const ids = this.uniqIds([...senderIds], parentReactors, replyReactors);
    if (ids.length === 0) return;

    this.loadUserProfiles(ids);
  }

  private reactorIdsFrom(raw: any): string[] {
    const map = this.normalizeToNew(raw);             
    return Object.values(map).reduce<string[]>(
      (acc, arr) => (acc.push(...arr), acc), []
    );
  }

  private uniqIds(...lists: string[][]): string[] {
    const s = new Set<string>();
    lists.forEach(l => l?.forEach(id => id && s.add(id)));
    return [...s];
  }

  getOtherParticipantId(): string {
    if (!this.parentMessage || !this.currentUserId) return '';
    return this.parentMessage.senderId === this.currentUserId
      ? this.replies.find(r => r.senderId !== this.currentUserId)?.senderId || ''
      : this.parentMessage.senderId;
  }
  getUserName(userId: string): string {
    return this.userMap[userId]?.name ?? 'Unbekannt';
  }

  getAvatarPath(userId: string): string {
    return this.userMap[userId]?.avatarPath ?? 'assets/images/profile-images/head-1.png';
  }

  loadUserProfiles(userIds: string[]) {
    this.userService.getUsersByIds(userIds).subscribe(users => {
      users.forEach(user => {
        this.userMap[user.uid] = {
          name: user.name,
          avatarPath: user.avatarPath || 'assets/images/default-avatar.png'
        };
      });
      this.cdr.detectChanges();
    });
  }

  async sendThreadMessage(text: string) {
    if (!text.trim()) return;
    const currentUser = await this.authService.getCurrentUser();
    if (!currentUser) {
      console.error('User not authenticated');
      return;
    }
    const thread = this.threadService.getCurrentThread(); // uses threadStateSubject
    if (!thread?.channelId || !thread?.messageId || !thread.threadType) {
      console.warn('Missing thread context');
      return;
    }
    const { channelId, messageId, threadType } = thread;
    const basePath =
      threadType === 'channel'
        ? `channels/${channelId}/messages/${messageId}/threads`
        : `directMessages/${channelId}/messages/${messageId}/threads`;
    const threadCollection = collection(this.firestore, basePath);
    try {
      await addDoc(threadCollection, {
        text: text.trim(),
        senderId: currentUser.uid,
        timestamp: new Date(),
      });
      if (threadType === 'channel') {
        await this.channelService.updateParentMessageThreadInfo(channelId, messageId);
      } else {
        await this.directMessagingService.updateParentMessageThreadInfo(channelId, messageId);
      }
    } catch (error) {
      console.error('❌ Error saving thread reply:', error);
    }
  }

  getCurrentThread(): ThreadState | null {
    return this.threadService.getCurrentThread();
  }

  close(event: Event) {
    this.closeThread.emit();
    event.stopPropagation();
  }

  captureMessage() {
    console.log(this.message);
    this.message = '';
  }

  toggleEmojiPicker() {
    this.emojiPicker = !this.emojiPicker;
  }

  addEmoji(event: any) {
    this.message += event.emoji.native;
    this.emojiPicker = false;
  }

  openProfileCard(userId: string): void {
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

  private initializeMentioningHandlers(): void {
    this.mentioningService.handleTagClicks({
      onUserClick: (userId: string) => this.openProfileCard(userId)
    });
  }
}