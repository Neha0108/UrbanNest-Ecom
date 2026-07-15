import { Injectable } from '@angular/core';

declare const google: any;

@Injectable({
  providedIn: 'root'
})
export class Google {

  private waitForGoogle(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutMs = 10000;
      const intervalMs = 50;
      let waited = 0;

      const check = () => {
        if (typeof google !== 'undefined' && google?.accounts?.id) {
          resolve();
          return;
        }
        waited += intervalMs;
        if (waited >= timeoutMs) {
          reject(new Error('Google Identity Services script failed to load'));
          return;
        }
        setTimeout(check, intervalMs);
      };

      check();
    });
  }

  async initialize(clientId: string, callback: (token: string) => void): Promise<void> {
    await this.waitForGoogle();

    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: any) => {
        callback(response.credential);
      }
    });
  }

  async renderButton(elementId: string): Promise<void> {
    await this.waitForGoogle();

    google.accounts.id.renderButton(
      document.getElementById(elementId),
      {
        theme: 'outline',
        size: 'large',
        width: 350
      }
    );
  }
}