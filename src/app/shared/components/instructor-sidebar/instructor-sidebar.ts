
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-instructor-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './instructor-sidebar.html',
  styleUrl: './instructor-sidebar.css',
})
export class InstructorSidebar {
  menuItems = [
    { name: 'dashboard', icon: '⌂', route: 'dashboard' },
    { name: 'myTracks', icon: '▤', route: 'tracks' },
    { name: 'assignments', icon: '☑', route: 'assignments' },
    { name: 'calendar', icon: '▦', route: 'calendar' },
    { name: 'interactiveActivities', icon: '◉', route: 'interactive' },
    { name: 'workshops', icon: '▣', route: 'workshops' },
    { name: 'quizzes', icon: '📝', route: 'quize' },
    { name: 'coachingChat', icon: '✉', route: 'chat' },
    { name: 'myProfile', icon: '♙', route: 'profile' },
  ];

  private logoutSubscription?: Subscription;

  constructor(
    public router: Router,
    private authService: AuthService,
    public languageService: LanguageService
  ) {}

  logout(): void {
    if (this.logoutSubscription) return;

    this.logoutSubscription = this.authService.logout().subscribe({
      next: () => {
        this.router.navigateByUrl('/');
      },
      error: (error) => {
        console.error('Logout failed:', error);
        this.logoutSubscription = undefined;
      },
      complete: () => {
        this.logoutSubscription = undefined;
      }
    });
  }

  selectPage(route: string): void {
    this.router.navigate(['/instructor', route]);
  }
}
