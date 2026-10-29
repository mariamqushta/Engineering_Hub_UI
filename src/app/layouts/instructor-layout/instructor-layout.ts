
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy
} from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, Subscription } from 'rxjs';
import { InstructorSidebar } from '../../shared/components/instructor-sidebar/instructor-sidebar';
import { AuthService } from '../../core/services/auth';
import { LanguageService } from '../../core/services/language.service';
import { environment } from '../../../environments/environment';
@Component({
  selector: 'app-instructor-layout',
  imports: [RouterOutlet, InstructorSidebar, CommonModule],
  templateUrl: './instructor-layout.html',
  styleUrl: './instructor-layout.css',
})
export class InstructorLayout implements OnInit, OnDestroy {
  activePage = 'Dashboard';

  fullName = '';
  username = '';
  profileImageUrl: string | null = null;

  isProfileLoading = true;

  private routerSubscription?: Subscription;
  private userSubscription?: Subscription;
  private imageSubscription?: Subscription;
  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
     public languageService: LanguageService,
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.updatePageTitle();

    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updatePageTitle();
      });

    this.imageSubscription = this.authService.profileImage$.subscribe(imageUrl => {
      if (imageUrl !== null) {
        this.profileImageUrl = this.getImageUrl(imageUrl);
        this.cdr.markForCheck();
      }
    });
  }
private getImageUrl(path: string | null): string | null {
  if (!path) return null;

  if (path.startsWith('http')) return path;

  return `${environment.apiUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}
  private loadCurrentUser(): void {
    this.isProfileLoading = true;

    this.userSubscription?.unsubscribe();

    this.userSubscription = this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.username = user.userName ?? user.username ?? '';
        this.fullName = user.fullName ?? this.username;

        this.profileImageUrl = this.getImageUrl(
        user.profileImageUrl ?? user.ProfileImageUrl ?? null
      );

        this.isProfileLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Could not load current user:', error);

        this.username = '';
        this.fullName = '';
        this.profileImageUrl = null;
        this.isProfileLoading = false;

        this.cdr.markForCheck();
      }
    });
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

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.userSubscription?.unsubscribe();
    this.imageSubscription?.unsubscribe();
  }


openProfile(): void {
  this.router.navigate(['/instructor/profile']);
}

}
