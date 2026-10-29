
import { Component, OnDestroy, OnInit,ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CoachingService, CoachingMessage } from '../../core/services/coaching-chat';
import { AuthService } from '../../core/services/auth';
import { LanguageService } from '../../core/services/language.service';
@Component({
  selector: 'app-coaching-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './coaching-chat.html',
  styleUrl: './coaching-chat.css'
})
export class CoachingChat implements OnInit, OnDestroy {
  trackId!: number;
  conversationId: number | null = null;

  currentUserId = '';
  newMessage = '';
  messages: {
    id: number;
    isMine: boolean;
    text: string;
    sentAt: Date;
  }[] = [];

  isLoading = true;
  isSending = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private coachingService: CoachingService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
     public languageService: LanguageService,
  ) {}

  ngOnInit(): void {
    this.trackId = Number(this.route.snapshot.paramMap.get('trackId'));

    if (!this.trackId) {
      this.errorMessage = 'Invalid track.';
      this.isLoading = false;
      return;
    }

    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUserId =
          user.id ?? user.userId ?? user.userID ?? '';

        this.openConversation();
      },
      error: () => {
        this.errorMessage = 'Please log in to use coaching chat.';
        this.isLoading = false;
      }
    });
  }

  private openConversation(): void {
    this.coachingService.getOrCreateConversation(this.trackId).subscribe({
      next: (response) => {
        this.conversationId = response.conversationId;

        this.loadMessages();
        this.connectToLiveChat();
      },
      error: (error) => {
        this.errorMessage =
          error.error?.message ??
          'Unable to open coaching chat. Check your coaching enrollment.';
        this.isLoading = false;
      }
    });
  }

  private loadMessages(): void {
    if (!this.conversationId) return;

    this.coachingService.getMessages(this.conversationId).subscribe({
     next: (messages) => {
          this.messages = messages.map((message) =>
            this.mapMessage(message)
          );
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      error: () => {
        this.errorMessage = 'Could not load previous messages.';
        this.isLoading = false;
      }
    });
  }

  private async connectToLiveChat(): Promise<void> {
    if (!this.conversationId) return;

    try {
      await this.coachingService.connectToConversation(
        this.conversationId,
        (message) => {
          // Avoid adding the same message twice.
          if (this.messages.some((item) => item.id === message.id)) {
            return;
          }

          this.messages.push(this.mapMessage(message));
        }
      );
    } catch (error) {
      console.error('SignalR connection failed:', error);
      this.errorMessage =
        'Live chat connection failed. You can still try sending messages.';
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

    if (!text || !this.conversationId || this.isSending) return;

    this.isSending = true;

    this.coachingService
      .sendMessage(this.conversationId, text)
      .subscribe({
        next: (message) => {
          // Add the sent message immediately if SignalR hasn't added it.
          if (!this.messages.some((item) => item.id === message.id)) {
            this.messages.push(this.mapMessage(message));
          }

          this.newMessage = '';
          this.isSending = false;
        },
        error: (error) => {
          console.error('Sending message failed:', error);
          this.errorMessage = 'Message could not be sent. Please try again.';
          this.isSending = false;
        }
      });
  }

  ngOnDestroy(): void {
    void this.coachingService.disconnect();
  }
}
