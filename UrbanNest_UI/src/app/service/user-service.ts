import { Injectable } from '@angular/core';
import { User } from '../interface/user';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../env/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  loginUser(useremail: string, userpassword: string) {
    return this.http.post<{ token: string }>(`${this.apiUrl}/Auth/Login`, {
      UserEmail: useremail,
      UserPassword: userpassword,
    });
  }

  registerUser(user: User): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/Auth/Register`, user);
  }

  isLoggedIn(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    return !!localStorage.getItem('token');
  }

  updateUser(data: any) {
    return this.http.put(`${this.apiUrl}/User/update`, data);
  }

  getUserInfo() {
    return this.http.get<any>(`${this.apiUrl}/Auth/getusername`);
  }

  changePassword(data: any) {
    return this.http.put(
      `${environment.apiUrl}/Auth/ChangePass`,
      data,
      {
        responseType: 'text'
      }
    );
  }

  sendOtp(email: string) {
    return this.http.post(`${this.apiUrl}/Auth/SendOtp`, { email });
  }

  verifyOtp(data: any) {
    return this.http.post(`${this.apiUrl}/Auth/VerifyOtp`, data);
  }

  resendOtp(email: string) {
    return this.http.post(`${this.apiUrl}/Auth/ResendOtp`, { email });
  }

  private toFormData(data: Record<string, any>): FormData {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    return formData;
  }

  getProductsByMaxPrice(price: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/Products/ByMaxPrice/${price}`);
  }

  getUserRole(): string | null {
    if (typeof window === 'undefined') return null;

    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      const role =
        payload.role ??
        payload.Role ??
        payload.UserRole ??
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

      return role ?? null;
    } catch {
      return null;
    }
  }

  getCurrentUserId(): number | null {
    if (typeof window === 'undefined') return null;

    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      const rawId =
        payload.UserId ??
        payload.userId ??
        payload.nameid ??
        payload.sub ??
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];

      if (rawId === undefined || rawId === null) return null;

      const id = Number(rawId);
      return isNaN(id) ? null : id;
    } catch {
      return null;
    }
  }

  googleLogin(idToken: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/Auth/GoogleLogin`, { idToken });
  }
}