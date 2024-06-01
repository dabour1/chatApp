import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'my-app';
  username: string | null = null;
  chatWebSocket!: WebSocket;
  chatContainer!: HTMLElement;
  messageInput!: HTMLInputElement;
  onlineUsersList!: HTMLElement;

  ngOnInit(): void {
    this.username = prompt('Please enter your name');
    console.log(this.username);

    this.chatContainer = document.getElementById(
      'chatContainer'
    ) as HTMLElement;
    this.messageInput = document.getElementById(
      'messageInput'
    ) as HTMLInputElement;
    this.onlineUsersList = document.getElementById(
      'onlineUsersList'
    ) as HTMLElement;

    this.chatWebSocket = new WebSocket('ws://localhost:8090');

    this.chatWebSocket.onopen = () => {
      console.log('Connection opened', this.chatWebSocket);
      const loginMessage = {
        username: this.username,
        login: true,
      };
      this.chatWebSocket.send(JSON.stringify(loginMessage));
    };

    this.chatWebSocket.onmessage = (event) => {
      console.log(event.data);
      const msgContent = JSON.parse(event.data);

      if (msgContent.type === 'login') {
        this.chatContainer.innerHTML += `<div class="text-center text-success message"><div class="content">${msgContent.message}</div></div>`;
      } else if (msgContent.type === 'logout') {
        this.chatContainer.innerHTML += `<div class="text-center text-danger message"><div class="content">${msgContent.message}</div></div>`;
      } else if (msgContent.type === 'chat') {
        const alignment = msgContent.message.startsWith(`${this.username}:`)
          ? 'me'
          : 'other';
        this.chatContainer.innerHTML += `<div class="message"><div class="content ${alignment}">${msgContent.message}</div></div>`;
      }

      this.onlineUsersList.innerHTML = '';
      msgContent.online.forEach((user: string) => {
        this.onlineUsersList.innerHTML += `<li class="list-group-item"><span class="rounded-circle p-1 m-1 bg-success"></span>${user}</li>`;
      });

      this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    };

    this.chatWebSocket.onerror = () => {
      this.chatContainer.innerHTML +=
        '<div class="text-center text-danger message"><div class="content">Error connecting to server</div></div>';
    };

    this.chatWebSocket.onclose = () => {
      this.chatContainer.innerHTML +=
        '<div class="text-center text-danger message"><div class="content">Connection closed</div></div>';
    };
  }

  sendMessage(): void {
    const msgVal = this.messageInput.value;
    if (msgVal.trim() !== '') {
      const chatMessage = {
        body: `${this.username}: ${msgVal}`,
      };
      this.chatWebSocket.send(JSON.stringify(chatMessage));
      this.chatContainer.innerHTML += `<div class="message"><div class="content me">Me: ${msgVal}</div></div>`;
      this.messageInput.value = '';
      this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }
  }

  clearChat(): void {
    this.chatContainer.innerHTML = '';
  }

  ngOnDestroy(): void {
    if (this.chatWebSocket) {
      this.chatWebSocket.close();
    }
  }
}
