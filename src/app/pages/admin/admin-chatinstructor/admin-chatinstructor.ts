
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  SupportChatService,
  SupportChatType,
  SupportChatMessage,
  SupportChatConversation
} from '../../../core/services/support-chat';
import { AuthService } from '../../../core/services/auth';
import { LanguageService } from '../../../core/services/language.service';
import { Time12Pipe } from '../../../shared/pipes/time-12.pipe';

@Component({
  selector: 'app-admin-chatinstructor',
  standalone: true,
  imports: [CommonModule, FormsModule, Time12Pipe],
  templateUrl: './admin-chatinstructor.html',
  styleUrl: './admin-chatinstructor.css'
})
export class AdminChatInstructor implements OnInit, OnDestroy {
  readonly chatType: SupportChatType = 'Instructor';

  currentUserId = '';
  conversations: SupportChatConversation[] = [];
  selectedConversation: SupportChatConversation | null = null;

  messages: {
    id: number;
    isMine: boolean;
    text: string;
    sentAt: Date;
  }[] = [];

  newMessage = '';
  isLoading = false;
  isSending = false;
  errorMessage = '';

  constructor(
    private supportChatService: SupportChatService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    public languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe({
      next: user => {
        this.currentUserId = user.id ?? user.userId ?? user.userID ?? '';
        this.connectAndLoadInbox();
      },
      error: () => {
        this.errorMessage =
          this.languageService.translate('loginToAccessInstructorChats');

        this.cdr.markForCheck();
      }
    });
  }

  private async connectAndLoadInbox(): Promise<void> {
    try {
      await this.supportChatService.connectAdmin(
        this.chatType,
        null,
        {
          onMessage: message => this.handleIncomingMessage(message),
          onConversationUpdated: conversation =>
            this.handleConversationUpdated(conversation),
          onMessagesRead: conversationId =>
            this.handleMessagesRead(conversationId)
        }
      );

      this.loadConversations();
    } catch (error) {
      console.error('Instructor chat connection failed:', error);
      this.errorMessage =
        this.languageService.translate('liveChatConnectionFailed');

      this.loadConversations();
      this.cdr.markForCheck();
    }
  }

  loadConversations(): void {
    this.isLoading = true;

    this.supportChatService.getInbox(this.chatType).subscribe({
      next: conversations => {
        this.conversations = conversations;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Loading instructor inbox failed:', error);
        this.errorMessage =
          this.languageService.translate('couldNotLoadInstructorConversations');

        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  async selectConversation(
    conversation: SupportChatConversation
  ): Promise<void> {
    if (
      this.selectedConversation?.conversationId ===
      conversation.conversationId
    ) {
      return;
    }

    this.selectedConversation = conversation;
    this.messages = [];
    this.errorMessage = '';
    this.isLoading = true;
    this.cdr.markForCheck();

    try {
      await this.supportChatService.joinAdminConversation(
        conversation.conversationId
      );

      this.supportChatService
        .getMessages(this.chatType, conversation.conversationId)
        .subscribe({
          next: messages => {
            this.messages = messages.map(message =>
              this.mapMessage(message)
            );
            conversation.unreadCount = 0;
            this.isLoading = false;
            this.cdr.markForCheck();
          },
          error: error => {
            console.error('Loading chat messages failed:', error);
            this.errorMessage =
              this.languageService.translate('couldNotLoadConversation');

            this.isLoading = false;
            this.cdr.markForCheck();
          }
        });
    } catch (error) {
      console.error('Joining instructor conversation failed:', error);
      this.errorMessage =
        this.languageService.translate('couldNotOpenConversation');

      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  private handleIncomingMessage(message: SupportChatMessage): void {
    const conversation = this.conversations.find(
      item => item.conversationId === message.conversationId
    );

    if (conversation) {
      conversation.lastMessage = message.message;
      conversation.lastMessageAtUtc = message.sentAtUtc;

      if (
        this.selectedConversation?.conversationId !==
        message.conversationId
      ) {
        conversation.unreadCount++;
      }
    }

    if (
      this.selectedConversation?.conversationId ===
        message.conversationId &&
      !this.messages.some(item => item.id === message.id)
    ) {
      this.messages.push(this.mapMessage(message));
    }

    this.sortConversations();
    this.cdr.markForCheck();
  }

  private handleConversationUpdated(
    updated: SupportChatConversation
  ): void {
    const existing = this.conversations.find(
      item => item.conversationId === updated.conversationId
    );

    if (existing) {
      Object.assign(existing, updated);
    } else {
      this.conversations.unshift(updated);
    }

    this.sortConversations();
    this.cdr.markForCheck();
  }

  private handleMessagesRead(conversationId: number): void {
    const conversation = this.conversations.find(
      item => item.conversationId === conversationId
    );

    if (conversation) {
      conversation.unreadCount = 0;
      this.cdr.markForCheck();
    }
  }

  private sortConversations(): void {
    this.conversations.sort((a, b) => {
      const dateA = a.lastMessageAtUtc
        ? new Date(a.lastMessageAtUtc).getTime()
        : 0;
      const dateB = b.lastMessageAtUtc
        ? new Date(b.lastMessageAtUtc).getTime()
        : 0;

      return dateB - dateA;
    });
  }

  private mapMessage(message: SupportChatMessage) {
    return {
      id: message.id,
      isMine: message.senderId === this.currentUserId,
      text: message.message,
      sentAt: new Date(message.sentAtUtc)
    };
  }

  sendMessage(): void {
    const text = this.newMessage.trim();
    const conversationId = this.selectedConversation?.conversationId;

    if (!text || !conversationId || this.isSending) {
      return;
    }

    this.isSending = true;

    this.supportChatService
      .sendMessage(this.chatType, conversationId, text)
      .subscribe({
        next: message => {
          if (!this.messages.some(item => item.id === message.id)) {
            this.messages.push(this.mapMessage(message));
          }

          this.newMessage = '';
          this.isSending = false;
          this.cdr.markForCheck();
        },
        error: error => {
          console.error('Sending instructor chat message failed:', error);
          this.errorMessage =
            this.languageService.translate('messageCouldNotBeSent');

          this.isSending = false;
          this.cdr.markForCheck();
        }
      });
  }

  ngOnDestroy(): void {
    void this.supportChatService.disconnect();
  }
}
