import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthStore } from '../../../core/store/auth/auth.store';
import { UserService } from '../../../core/services/user.service';
import { ThemeService } from '../../../core/services/theme.service';
import { User, UserProfile } from '../../../core/models/user.model';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings implements OnInit {
  authStore = inject(AuthStore);
  userService = inject(UserService);
  themeService = inject(ThemeService);
  router = inject(Router);

  isLoading = signal(false);
  message = signal<{ type: 'success' | 'error', text: string } | null>(null);
  isEditingProfile = signal(false);
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);

  // Form data
  formData = signal({
    full_name: '',
    email: '',
    bio: '',
    date_of_birth: '',
    address: '',
    city: '',
    country: ''
  });

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    const user = this.authStore.user();
    if (user) {
      this.formData.set({
        full_name: user.full_name || '',
        email: user.email || '',
        bio: user.profile?.bio || '',
        date_of_birth: user.profile?.date_of_birth || '',
        address: user.profile?.address || '',
        city: user.profile?.city || '',
        country: user.profile?.country || ''
      });
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleEditProfile(): void {
    this.isEditingProfile.update(val => !val);
    if (!this.isEditingProfile()) {
      this.loadUserData(); // Reset form if cancelled
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.showMessage('error', 'Image size should not exceed 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.showMessage('error', 'Please select an image file');
        return;
      }

      this.selectedFile.set(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  uploadProfilePicture(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.isLoading.set(true);
    this.userService.uploadProfilePicture(file).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.showMessage('success', 'Profile picture updated successfully');
          this.selectedFile.set(null);
          this.previewUrl.set(null);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        this.showMessage('error', error.error?.message || 'Failed to upload image');
        this.isLoading.set(false);
      }
    });
  }

  saveProfile(): void {
    this.isLoading.set(true);
    const data = this.formData();

    this.userService.updateProfile({
      full_name: data.full_name,
      email: data.email,
      profile: {
        bio: data.bio,
        date_of_birth: data.date_of_birth || undefined,
        address: data.address,
        city: data.city,
        country: data.country
      }
    }).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.showMessage('success', 'Profile updated successfully');
          this.isEditingProfile.set(false);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        this.showMessage('error', error.error?.message || 'Failed to update profile');
        this.isLoading.set(false);
      }
    });
  }

  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authStore.logout();
    }
  }

  navigateBack(): void {
    this.router.navigate(['/dashboard']);
  }

  private showMessage(type: 'success' | 'error', text: string): void {
    this.message.set({ type, text });
    setTimeout(() => this.message.set(null), 5000);
  }

  getProfilePictureUrl(): string {
    const user = this.authStore.user();
    return user?.profile?.display_picture || 'assets/images/default-avatar.png';
  }
}
