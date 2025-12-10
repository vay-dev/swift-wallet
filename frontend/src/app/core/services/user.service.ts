import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserProfile } from '../models/user.model';
import { AuthStore } from '../store/auth/auth.store';

export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private authStore = inject(AuthStore);
  private apiUrl = `${environment.apiUrl}/user`;

  getProfile(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/profile/`);
  }

  updateProfile(data: Partial<User> & { profile?: Partial<UserProfile> }): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/profile/`, data).pipe(
      tap(response => {
        if (response.status === 'success') {
          this.authStore.updateUser(response.data);
        }
      })
    );
  }

  uploadProfilePicture(file: File): Observable<ApiResponse<{ display_picture: string }>> {
    const formData = new FormData();
    formData.append('display_picture', file);
    return this.http.post<ApiResponse<{ display_picture: string }>>(
      `${this.apiUrl}/profile/picture/`,
      formData
    ).pipe(
      tap(response => {
        if (response.status === 'success') {
          // Update user in auth store with new picture URL
          const currentUser = this.authStore.user();
          if (currentUser) {
            this.authStore.updateUser({
              ...currentUser,
              profile: {
                ...currentUser.profile,
                display_picture: response.data.display_picture
              }
            });
          }
        }
      })
    );
  }
}
