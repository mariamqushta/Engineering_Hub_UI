
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel
} from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
export interface CoachingMessage {
  id: number;
  conversationId: number;
  senderId: string;
  message: string;
  sentAt: string | Date;
  isRead: boolean;
}
export interface InstructorConversation {
  conversationId: number;
  studentName: string;
  trackTitle: string;
  lastMessage: string;
}
@Injectable({
  providedIn: 'root'
})
export class CoachingService {
  private apiUrl = `${environment.apiUrl}/api/Coaching`;
  private hubUrl = `${environment.apiUrl}/coachingHub`;

  private hubConnection?: HubConnection;

  constructor(private http: HttpClient) {}

  // Open or create the coaching conversation
  getOrCreateConversation(trackId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/conversation/${trackId}`,
      {},
      { withCredentials: true }
    );
  }

  // Load previous messages
  getMessages(
    conversationId: number
  ): Observable<CoachingMessage[]> {
    return this.http.get<CoachingMessage[]>(
      `${this.apiUrl}/conversation/${conversationId}/messages`,
      { withCredentials: true }
    );
  }

  // Send a message to the backend
  sendMessage(
    conversationId: number,
    message: string
  ): Observable<CoachingMessage> {
    return this.http.post<CoachingMessage>(
      `${this.apiUrl}/message`,
      {
        conversationId,
        message
      },
      { withCredentials: true }
    );
  }

  // Connect to SignalR and join the conversation


async connectToConversation(
  conversationId: number,
  onMessageReceived: (message: CoachingMessage) => void
): Promise<void> {
  await this.disconnect();

  const connection = new HubConnectionBuilder()
    .withUrl(this.hubUrl, { withCredentials: true })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Information)
    .build();

  this.hubConnection = connection;

  connection.on('ReceiveMessage', (message: CoachingMessage) => {
    onMessageReceived(message);
  });

  try {
    console.log('1. Starting SignalR connection...');

    await connection.start();

    console.log('2. SignalR connected');

    await connection.invoke('JoinConversation', conversationId);

    console.log('3. Joined conversation:', conversationId);
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

async disconnect(): Promise<void> {
  const connection = this.hubConnection;

  if (!connection) {
    return;
  }

  this.hubConnection = undefined;

  if (connection.state !== 'Disconnected') {
    await connection.stop();
  }
}


  // Disconnect when leaving the chat
  // async disconnect(): Promise<void> {
  //   if (this.hubConnection) {
  //     const connection = this.hubConnection;
  //     this.hubConnection = undefined;
  //     await connection.stop();
  //   }
  // }


getInstructorConversations(): Observable<InstructorConversation[]> {
  return this.http.get<InstructorConversation[]>(
    `${this.apiUrl}/conversations`,
    { withCredentials: true }
  );
}
}
