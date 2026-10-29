
import {
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID
} from '@angular/core';

import {
  NavigationEnd,
  Router,
  RouterOutlet
} from '@angular/router';
import { LanguageService } from '../../core/services/language.service';
import { environment } from '../../../environments/environment';
import {
  CommonModule,
  isPlatformBrowser
} from '@angular/common';

import { filter, Subscription, take } from 'rxjs';
import { AdminSidebar } from '../../shared/components/admin-sidebar/admin-sidebar';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, AdminSidebar, CommonModule],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css'
})
export class AdminLayout implements OnInit, OnDestroy {
  activePage = 'Dashboard';

  fullName = '';
  username = '';
  profileImageUrl: string | null = null;

  isProfileLoading = true;
  isAuthorizing = true;
  isAuthorized = false;
  authorizationError = '';

  private routerSubscription?: Subscription;
  private userSubscription?: Subscription;
  private imageSubscription?: Subscription;


  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
     public languageService: LanguageService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    this.updatePageTitle();

    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.updatePageTitle());

    this.imageSubscription = this.authService.profileImage$
      .subscribe(imageUrl => {
        if (imageUrl !== null) {
          this.profileImageUrl = this.getImageUrl(imageUrl);
          this.cdr.markForCheck();
        }
      });

    // Do not call the local HTTPS API during server-side rendering.
    if (isPlatformBrowser(this.platformId)) {
      this.verifyAdmin();
    }
  }

  private verifyAdmin(): void {
    this.isAuthorizing = true;
    this.isAuthorized = false;
    this.authorizationError = '';

    this.userSubscription?.unsubscribe();

    this.userSubscription = this.authService.getCurrentUser()
      .pipe(take(1))
      .subscribe({
        next: user => {
          const roleValue =
            user?.roles ??
            user?.Roles ??
            user?.role ??
            user?.Role;

          const roles: string[] = Array.isArray(roleValue)
            ? roleValue
            : typeof roleValue === 'string'
              ? [roleValue]
              : [];

          const isAdmin = roles.some(role =>
            ['Admin', 'SuperAdmin'].includes(role)
          );

          if (!isAdmin) {
            this.isAuthorized = false;
            this.isAuthorizing = false;
            this.isProfileLoading = false;
            this.cdr.markForCheck();

            void this.router.navigate(['/']);
            return;
          }

          this.username = user.userName ?? user.username ?? '';
          this.fullName = user.fullName ?? this.username;

          this.profileImageUrl = this.getImageUrl(
            user.profileImageUrl ??
            user.ProfileImageUrl ??
            null
          );

          this.isAuthorized = true;
          this.isAuthorizing = false;
          this.isProfileLoading = false;

          this.cdr.markForCheck();
        },

        error: error => {
          console.error('Admin authorization request failed:', error);

          this.isAuthorized = false;
          this.isAuthorizing = false;
          this.isProfileLoading = false;

          this.authorizationError =
            error.status === 401
              ? 'Your session could not be verified. Please sign in again if it has expired.'
              : 'Unable to verify administrator access. Please try again.';

          this.cdr.markForCheck();
        }
      });
  }

  retryAuthorization(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.verifyAdmin();
    }
  }

  goToLogin(): void {
    void this.router.navigate(['/login']);
  }

  private getImageUrl(path: string | null): string | null {
    if (!path) {
      return null;
    }

    if (path.startsWith('http')) {
      return path;
    }

return `${environment.apiUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  get avatarLetter(): string {
    const name = this.fullName || this.username;
    return name.trim().charAt(0).toUpperCase() || '?';
  }

  private updatePageTitle(): void {
    const page = this.router.url.split('?')[0].split('/')[2];

  const pageTitles: Record<string, string> = {
  dashboard: 'dashboard',
  bookings: 'bookingRequests',
  tracks: 'tracks',
  instructors: 'instructors',
  students: 'students',
  workshops: 'workshops',
  interactive: 'interactiveActivities',
  profile: 'myProfile'
};

    this.activePage = this.languageService.translate(pageTitles[page] || 'dashboard');
  }

  openProfile(): void {
    void this.router.navigate(['/admin/profile']);
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.userSubscription?.unsubscribe();
    this.imageSubscription?.unsubscribe();
  }
}
