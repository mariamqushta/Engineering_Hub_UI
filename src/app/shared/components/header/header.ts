
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import {
  Router,
  RouterLink,
  NavigationEnd
} from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth';
import { LanguageService } from '../../../core/services/language.service';
import { environment } from '../../../../environments/environment';
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit, OnDestroy {
  isLoggedIn = false;
  profilePath = '/login';
  profileImageUrl: string | null = null;
  fullName = '';
  userName = '';

  private routerSubscription?: Subscription;
  private userSubscription?: Subscription;
  private isCheckingUser = false;

  constructor(
  private authService: AuthService,
  private router: Router,
  private cdr: ChangeDetectorRef,
  public languageService: LanguageService
) {}
  ngOnInit(): void {
    this.checkLogin();

    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (!this.isCheckingUser) {
          this.checkLogin();
        }
      });
  }

  checkLogin(): void {
    if (this.isCheckingUser) return;

    this.isCheckingUser = true;
    this.userSubscription?.unsubscribe();

    this.userSubscription = this.authService
      .getCurrentUser()
      .subscribe({
        next: (user: any) => {
          this.isLoggedIn = true;
          this.fullName = user.fullName ?? '';
          this.userName = user.userName ?? user.username ?? '';

          const image = user.profileImageUrl ?? user.ProfileImageUrl ?? null;

          // The backend returns a relative path, so use the API server origin.
          this.profileImageUrl = image
            ? image.startsWith('http')
              ? image
              : `${environment.apiUrl}${image.startsWith('/') ? '' : '/'}${image}`
            : null;

          const roles: string[] = user.roles ?? [];

          if (roles.includes('Instructor')) {
            this.profilePath = '/instructor/profile';
          } else if (roles.includes('Student')) {
            this.profilePath = '/student/profile';
          } else {
            this.profilePath = '/';
          }

          this.isCheckingUser = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoggedIn = false;
          this.profilePath = '/login';
          this.profileImageUrl = null;
          this.fullName = '';
          this.userName = '';

          this.isCheckingUser = false;
          this.cdr.markForCheck();
        }
      });
  }

  get avatarLetter(): string {
    return (this.fullName || this.userName || 'U')
      .trim()
      .charAt(0)
      .toUpperCase();
  }

  openProfile(): void {
    this.router.navigateByUrl(
      this.isLoggedIn ? this.profilePath : '/login'
    );
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.isLoggedIn = false;
        this.profilePath = '/login';
        this.profileImageUrl = null;
        this.fullName = '';
        this.userName = '';

        this.cdr.markForCheck();
        this.router.navigateByUrl('/');
      },
      error: (error: any) => {
        console.error('Logout error:', error);
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.userSubscription?.unsubscribe();
  }
}
