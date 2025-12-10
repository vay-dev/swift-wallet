import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, of } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DatabaseService } from '../../services/db.service';
import { User, LoginRequest, SignupVerifyRequest } from '../../models/user.model';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ user, isAuthenticated }) => ({
    isVerified: computed(() => user()?.is_verified ?? false),
    userFullName: computed(() => user()?.full_name ?? ''),
    userPhone: computed(() => user()?.phone_number ?? '')
  })),
  withMethods((
    store,
    authService = inject(AuthService),
    dbService = inject(DatabaseService),
    router = inject(Router)
  ) => ({
    // Initialize auth state from storage
    init: rxMethod<void>(
      pipe(
        switchMap(() => {
          const user = authService.getCurrentUser();
          const isAuthenticated = authService.isAuthenticated();

          if (user && isAuthenticated) {
            patchState(store, { user, isAuthenticated });
          }

          return of(null);
        })
      )
    ),

    // Login
    login: rxMethod<LoginRequest>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((credentials) =>
          authService.login(credentials).pipe(
            tap(async (response) => {
              if (response.status === 'success') {
                const user = response.data.user;
                patchState(store, {
                  user,
                  isAuthenticated: true,
                  isLoading: false,
                  error: null
                });

                // Save to IndexedDB
                await dbService.saveUser(user);

                // Navigate to dashboard
                router.navigate(['/dashboard']);
              }
            }),
            catchError((error) => {
              patchState(store, {
                isLoading: false,
                error: error.error?.message || 'Login failed'
              });
              return of(null);
            })
          )
        )
      )
    ),

    // Signup
    signup: rxMethod<SignupVerifyRequest>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((data) =>
          authService.verifySignupOTP(data).pipe(
            tap(async (response) => {
              if (response.status === 'success') {
                const user = response.data.user;
                patchState(store, {
                  user,
                  isAuthenticated: true,
                  isLoading: false,
                  error: null
                });

                // Save to IndexedDB
                await dbService.saveUser(user);

                // Navigate to dashboard
                router.navigate(['/dashboard']);
              }
            }),
            catchError((error) => {
              patchState(store, {
                isLoading: false,
                error: error.error?.message || 'Signup failed'
              });
              return of(null);
            })
          )
        )
      )
    ),

    // Logout
    logout: () => {
      authService.logout();
      dbService.clearAllData();
      patchState(store, initialState);
      router.navigate(['/auth/login']);
    },

    // Clear error
    clearError: () => {
      patchState(store, { error: null });
    },

    // Update user
    updateUser: (user: User) => {
      patchState(store, { user });
      localStorage.setItem('user', JSON.stringify(user));
    }
  }))
);
