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

@Component({
  selector: 'app-student-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-admin.html',
  styleUrl: './student-admin.css'
})
export class StudentAdmin implements OnInit, OnDestroy {

  readonly chatType: SupportChatType = 'Student';

  currentUserId = '';
  conversation: SupportChatConversation | null = null;

  messages: {
    id: number;
    isMine: boolean;
    text: string;
    sentAt: Date;
  }[] = [];

  newMessage = '';
  isLoading = true;
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
        this.openConversation();
      },
      error: () => {
        this.errorMessage =
          this.languageService.translate('loginToContactAdmin');

        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private openConversation(): void {
    this.supportChatService.getStudentConversation().subscribe({
      next: conversation => {
        this.conversation = conversation;
        this.connectAndLoadMessages(conversation.conversationId);
      },
      error: error => {
        console.error('Opening student chat failed:', error);

        this.errorMessage =
          this.languageService.translate('couldNotOpenConversation');

        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private async connectAndLoadMessages(
    conversationId: number
  ): Promise<void> {
    try {
      await this.supportChatService.connectParticipant(
        this.chatType,
        conversationId,
        {
          onMessage: message => this.handleIncomingMessage(message),
          onConversationUpdated: () => {},
          onMessagesRead: () => {}
        }
      );
    } catch (error) {
      console.error('Student chat connection failed:', error);

      this.errorMessage =
        this.languageService.translate('liveChatConnectionFailed');

      this.cdr.markForCheck();
    }

    this.supportChatService
      .getMessages(this.chatType, conversationId)
      .subscribe({
        next: messages => {
          this.messages = messages.map(message =>
            this.mapMessage(message)
          );

          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: error => {
          console.error('Loading student messages failed:', error);

          this.errorMessage =
            this.languageService.translate('couldNotLoadPreviousMessages');

          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  private handleIncomingMessage(message: SupportChatMessage): void {
    if (
      this.conversation?.conversationId !== message.conversationId ||
      this.messages.some(item => item.id === message.id)
    ) {
      return;
    }

    this.messages.push(this.mapMessage(message));
    this.cdr.markForCheck();
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
    const conversationId = this.conversation?.conversationId;

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
          console.error('Sending student message failed:', error);

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