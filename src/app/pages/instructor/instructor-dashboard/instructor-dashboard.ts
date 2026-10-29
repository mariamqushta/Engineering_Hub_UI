
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LanguageService } from '../../../core/services/language.service';
import { environment } from '../../../../environments/environment';
@Component({
  selector: 'app-instructor-dashboard',
  imports: [],
  templateUrl: './instructor-dashboard.html',
  styleUrl: './instructor-dashboard.css',
})
export class InstructorDashboard {
  constructor(private router: Router,
       public languageService: LanguageService,) {}

  selectPage(page: string): void {
    const routes: Record<string, string> = {
      'Dashboard': '/instructor/dashboard',
      'My Tracks': '/instructor/tracks',
      'Assignments': '/instructor/assignments',
      'Calendar': '/instructor/calendar',
      'Interactive Activities': '/instructor/interactive',
      'Workshops': '/instructor/workshops',
      'Coaching Chat': '/instructor/chat',
      'My Profile': '/instructor/profile',
    };

    const route = routes[page];

    if (route) {
      this.router.navigate([route]);
    }
  }
}
