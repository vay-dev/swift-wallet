import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  SignupOTPRequest,
  SignupVerifyRequest,
  AuthTokens,
  User
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const user = localStorage.getItem('user');
    if (user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  requestSignupOTP(data: SignupOTPRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup/request-otp/`, data);
  }

  verifySignupOTP(data: SignupVerifyRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signup/verify-otp/`, data).pipe(
      tap(response => {
        if (response.status === 'success') {
          this.setTokens(response.data.tokens);
          this.setUser(response.data.user);
        }
      })
    );
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login/`, data).pipe(
      tap(response => {
        if (response.status === 'success') {
          this.setTokens(response.data.tokens);
          this.setUser(response.data.user);
        }
      })
    );
  }

  refreshToken(refresh: string): Observable<{ access: string }> {
    return this.http.post<{ access: string }>(`${this.apiUrl}/refresh/`, { refresh }).pipe(
      tap(response => {
        if (response.access) {
          localStorage.setItem('access_token', response.access);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  private setTokens(tokens: AuthTokens): void {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
  }

  private setUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  generateDeviceId(): string {
    // Generate a unique device ID based on browser fingerprint
    const nav = window.navigator;
    const screen = window.screen;
    let deviceId = nav.userAgent + screen.height + screen.width + screen.colorDepth;

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < deviceId.length; i++) {
      const char = deviceId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return 'device_' + Math.abs(hash).toString(36);
  }
}
