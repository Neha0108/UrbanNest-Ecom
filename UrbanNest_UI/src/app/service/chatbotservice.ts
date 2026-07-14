import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../env/environment';
import { ChatMessage, ChatResponse } from '../interface/chat-message';

@Injectable({ providedIn: 'root' })
export class Chatbotservice {
  private apiUrl = `${environment.apiUrl}/Chatbot`;

  constructor(private http: HttpClient) {}

  ask(message: string) {
    return this.http.post<ChatResponse>(`${this.apiUrl}/Ask`, { message });
  }
}