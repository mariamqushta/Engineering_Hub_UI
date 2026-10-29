
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import {
  CoachingService,
  CoachingMessage,
  InstructorConversation
} from '../../../core/services/coaching-chat';
import { AuthService } from '../../../core/services/auth';
import { LanguageService } from '../../../core/services/language.service';
import { environment } from '../../../../environments/environment';

interface ChatConversation {
  conversationId: number;
  studentName: string;
  trackTitle: string;
  lastMessage: string;
}

@Component({
  selector: 'app-instructor-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './instructor-chat.html',
  styleUrl: './instructor-chat.css'
})
export class InstructorChat implements OnInit, OnDestroy {
  currentUserId = '';
  conversations: ChatConversation[] = [];
  selectedConversation: ChatConversation | null = null;

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
    private coachingService: CoachingService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
     public languageService: LanguageService,
  ) {}

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUserId =
          user.id ?? user.userId ?? user.userID ?? '';

        // The instructor conversation-list API will populate this list.
        this.loadConversations();
      },
      error: () => {
        this.errorMessage = 'Please log in to access instructor chat.';
      }
    });
  }

loadConversations(): void {
  this.isLoading = true;
  this.errorMessage = '';

  this.coachingService.getInstructorConversations().subscribe({
    next: (conversations) => {
      this.conversations = conversations;
      this.isLoading = false;
       this.cdr.markForCheck();
    },
    error: (error) => {
      console.error('Loading conversations failed:', error);
      this.errorMessage = 'Could not load student conversations.';
      this.isLoading = false;
    }
  });
}


async selectConversation(conversation: ChatConversation): Promise<void> {
  if (this.selectedConversation?.conversationId === conversation.conversationId) {
    return;
  }

  this.selectedConversation = conversation;
  this.messages = [];
  this.errorMessage = '';
  this.isLoading = true;

  try {
    // Finish disconnecting before loading the new conversation.
    await this.coachingService.disconnect();

    const messages = await new Promise<CoachingMessage[]>((resolve, reject) => {
      this.coachingService
        .getMessages(conversation.conversationId)
        .subscribe({
          next: resolve,
          error: reject
        });
    });

    this.messages = messages.map(message => this.mapMessage(message));
    this.isLoading = false;
    this.cdr.markForCheck();

    // Connect for live messages after loading the history.
    void this.connectToConversation(conversation.conversationId);
  } catch (error) {
    console.error('Opening conversation failed:', error);
    this.errorMessage = 'Could not open this conversation. Please try again.';
    this.isLoading = false;
    this.cdr.markForCheck();
  }
}


  private async connectToConversation(conversationId: number): Promise<void> {
    try {
      await this.coachingService.connectToConversation(
        conversationId,
        (message) => {
          if (this.selectedConversation?.conversationId !== message.conversationId) {
            return;
          }

          if (this.messages.some((item) => item.id === message.id)) {
            return;
          }

          this.messages.push(this.mapMessage(message));

          const conversation = this.conversations.find(
            (item) => item.conversationId === conversationId
          );

          if (conversation) {
            conversation.lastMessage = message.message;
          }
        }
      );
    } catch (error) {
      console.error('SignalR connection failed:', error);
      this.errorMessage = 'Live chat connection failed.';
    }
  }

  private mapMessage(message: CoachingMessage) {
    return {
      id: message.id,
      isMine: message.senderId === this.currentUserId,
      text: message.message,
      sentAt: new Date(message.sentAt)
    };
  }

  sendMessage(): void {
    const text = this.newMessage.trim();
    const conversationId = this.selectedConversation?.conversationId;

    if (!text || !conversationId || this.isSending) {
      return;
    }

    this.isSending = true;

    this.coachingService.sendMessage(conversationId, text).subscribe({
      next: (message) => {
        if (!this.messages.some((item) => item.id === message.id)) {
          this.messages.push(this.mapMessage(message));
        }

        this.newMessage = '';
        this.isSending = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Sending message failed:', error);
        this.errorMessage = 'Message could not be sent.';
        this.isSending = false;
      }
    });
  }

  ngOnDestroy(): void {
    void this.coachingService.disconnect();
  }
}
