import { Injectable, inject } from "@angular/core";
import {
  Firestore,
  collection,
  collectionData,
  collectionGroup,
  CollectionReference,
  Query,
} from "@angular/fire/firestore";
import { Observable, map } from "rxjs";
import { ChannelMessage } from "../interfaces/channel-message";
import { ChatUser } from "../interfaces/chat-user";
import { DirectMessage } from "../interfaces/direct-message";
import { ActivatedRoute } from "@angular/router";
import { ElementRef } from "@angular/core";

@Injectable({ providedIn: "root" })
export class SearchService {
  constructor() {}

  private firestore = inject(Firestore);

  searchUsers(term: string): Observable<ChatUser[]> {
    const usersRef = collection(
      this.firestore,
      "users"
    ) as unknown as CollectionReference<ChatUser>;
    return collectionData(usersRef, { idField: "id" }).pipe(
      map((users) =>
        users.filter((user: ChatUser) =>
          user.name?.toLowerCase().includes(term.toLowerCase())
        )
      )
    );
  }

  searchChannelMessages(term: string): Observable<ChannelMessage[]> {
    const messagesRef = collectionGroup(
      this.firestore,
      "messages"
    ) as Query<ChannelMessage>;
    return collectionData<ChannelMessage>(messagesRef, { idField: "id" }).pipe(
      map((messages) =>
        messages.filter((msg: ChannelMessage) =>
          msg.text?.toLowerCase().includes(term.toLowerCase())
        )
      )
    );
  }

  searchMyDirectMessages(
    term: string,
    currentUserId: string
  ): Observable<DirectMessage[]> {
    const directMessagesRef = collectionGroup(
      this.firestore,
      "messages"
    ) as Query<DirectMessage>;
    return collectionData<DirectMessage>(directMessagesRef, {
      idField: "id",
    }).pipe(
      map((messages) =>
        messages.filter(
          (msg: DirectMessage) =>
            (msg.messageFrom === currentUserId ||
              msg.messageTo === currentUserId) &&
            msg.message?.toLowerCase().includes(term.toLowerCase())
        )
      )
    );
  }

  handleHighlightScroll(
    refScrollContainer: string,
    elementRef: ElementRef,
    route: ActivatedRoute
  ): void {
    route.queryParams.subscribe((params) => {
      const highlightId = params["highlight"];
      if (highlightId) {
        setTimeout(() => {
          const target = elementRef.nativeElement.querySelector(
            `#message-${highlightId}`
          ) as HTMLElement | null;
          const scrollContainer = elementRef.nativeElement.querySelector(
            refScrollContainer
          ) as HTMLElement | null;

          if (target && scrollContainer) {
            const extraOffset = 80;
            const topOffset = target.offsetTop;
            scrollContainer.scrollTo({
              top: topOffset - extraOffset,
              behavior: "smooth",
            });

            target.classList.add("highlight");
            setTimeout(() => target.classList.remove("highlight"), 3000);
          }
        }, 100);
      }
    });
  }
}
