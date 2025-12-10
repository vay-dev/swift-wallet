import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthStore } from './core/store/auth/auth.store';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('frontend');
  private authStore = inject(AuthStore);
  private themeService = inject(ThemeService);

  ngOnInit(): void {
    // Initialize auth state from storage
    this.authStore.init();

    // Theme service is already initialized via its constructor
  }
}
