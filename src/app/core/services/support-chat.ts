
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel
} from '@microsoft/signalr';
import { environment } from '../../../environments/environment';

export type SupportChatType = 'Student' | 'Instructor';

export interface SupportChatMessage {
  id: number;
  conversationId: number;
  senderId: string;
  senderName: string;
  message: string;
  sentAtUtc: string | Date;
  isRead: boolean;
}

export interface SupportChatConversation {
  conversationId: number;
  participantId: string;
  participantName: string;
  participantAccountType: number | null;
  lastMessage: string;
  lastMessageAtUtc: string | Date | null;
  unreadCount: number;
}

export interface SendSupportChatMessage {
  conversationId: number;
  message: string;
}

export interface SupportChatCallbacks {
  onMessage: (message: SupportChatMessage) => void;
  onConversationUpdated: (conversation: SupportChatConversation) => void;
  onMessagesRead: (conversationId: number) => void;
}

@Injectable({
  providedIn: 'root'
})
export class SupportChatService {
  private readonly apiUrl = `${environment.apiUrl}/api/SupportChat`;
  private readonly hubUrl = `${environment.apiUrl}/supportChatHub`;

  private hubConnection?: HubConnection;
  private currentType?: SupportChatType;
  private currentConversationId?: number;
  private isAdminConnection = false;
  private callbacks?: SupportChatCallbacks;

  constructor(private http: HttpClient) {}

  // Student opens or creates their own conversation.
  getStudentConversation(): Observable<SupportChatConversation> {
    return this.http.get<SupportChatConversation>(
      `${this.apiUrl}/students/conversation`,
      { withCredentials: true }
    );
  }

  // Instructor opens or creates their own conversation.
  getInstructorConversation(): Observable<SupportChatConversation> {
    return this.http.get<SupportChatConversation>(
      `${this.apiUrl}/instructors/conversation`,
      { withCredentials: true }
    );
  }

  // Admin loads the inbox for the selected chat type.
  getInbox(type: SupportChatType): Observable<SupportChatConversation[]> {
    const endpoint = type === 'Student' ? 'students' : 'instructors';

    return this.http.get<SupportChatConversation[]>(
      `${this.apiUrl}/${endpoint}/inbox`,
      { withCredentials: true }
    );
  }

  getMessages(
    type: SupportChatType,
    conversationId: number
  ): Observable<SupportChatMessage[]> {
    const endpoint = type === 'Student' ? 'students' : 'instructors';

    return this.http.get<SupportChatMessage[]>(
      `${this.apiUrl}/${endpoint}/conversations/${conversationId}/messages`,
      { withCredentials: true }
    );
  }

  sendMessage(
    type: SupportChatType,
    conversationId: number,
    message: string
  ): Observable<SupportChatMessage> {
    const endpoint = type === 'Student' ? 'students' : 'instructors';

    return this.http.post<SupportChatMessage>(
      `${this.apiUrl}/${endpoint}/messages`,
      { conversationId, message },
      { withCredentials: true }
    );
  }

  // Admin joins the inbox and, when selected, one conversation.
  async connectAdmin(
    type: SupportChatType,
    conversationId: number | null,
    callbacks: SupportChatCallbacks
  ): Promise<void> {
    await this.startConnection(type, conversationId, true, callbacks);
  }

  // Student or instructor joins only their own conversation.
  async connectParticipant(
    type: SupportChatType,
    conversationId: number,
    callbacks: SupportChatCallbacks
  ): Promise<void> {
    await this.startConnection(type, conversationId, false, callbacks);
  }

  private async startConnection(
    type: SupportChatType,
    conversationId: number | null,
    isAdmin: boolean,
    callbacks: SupportChatCallbacks
  ): Promise<void> {
    await this.disconnect();

    this.currentType = type;
    this.currentConversationId = conversationId ?? undefined;
    this.isAdminConnection = isAdmin;
    this.callbacks = callbacks;

    const connection = new HubConnectionBuilder()
      .withUrl(this.hubUrl, { withCredentials: true })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    this.hubConnection = connection;

    connection.on('ReceiveMessage', (message: SupportChatMessage) => {
      this.callbacks?.onMessage(message);
    });

    connection.on(
      'ConversationUpdated',
      (conversation: SupportChatConversation) => {
        this.callbacks?.onConversationUpdated(conversation);
      }
    );

    connection.on('MessagesRead', (conversationId: number) => {
      this.callbacks?.onMessagesRead(conversationId);
    });

    connection.onreconnected(async () => {
      await this.joinCurrentGroups();
    });

    try {
      await connection.start();
      await this.joinCurrentGroups();
    } catch (error) {
      if (this.hubConnection === connection) {
        this.hubConnection = undefined;
      }

      try {
        await connection.stop();
      } catch {
        // Ignore cleanup errors.
      }

      throw error;
    }
  }

  private async joinCurrentGroups(): Promise<void> {
    if (!this.hubConnection || !this.currentType) {
      return;
    }

    if (this.isAdminConnection) {
      await this.hubConnection.invoke('JoinInbox', this.currentType);
    }

    if (this.currentConversationId) {
      await this.hubConnection.invoke(
        'JoinConversation',
        this.currentType,
        this.currentConversationId
      );
    }
  }

  async joinAdminConversation(conversationId: number): Promise<void> {
    if (!this.hubConnection || !this.currentType || !this.isAdminConnection) {
      return;
    }

    this.currentConversationId = conversationId;

    await this.hubConnection.invoke(
      'JoinConversation',
      this.currentType,
      conversationId
    );
  }

  async disconnect(): Promise<void> {
    const connection = this.hubConnection;

    this.hubConnection = undefined;
    this.currentType = undefined;
    this.currentConversationId = undefined;
    this.isAdminConnection = false;
    this.callbacks = undefined;

    if (connection && connection.state !== 'Disconnected') {
      await connection.stop();
    }
  }
}
