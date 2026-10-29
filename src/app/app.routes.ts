import { Routes } from '@angular/router';
import { StudentProfile } from './pages/student/student-profile/student-profile';
import { Home } from './pages/home/home';
import { TrackDetails } from './pages/track-details/track-details';
import { Register } from './pages/register/register';
import { Login } from './pages/login/login';
import { TrackBooking } from './pages/track-booking/track-booking';
import { LessonLearning } from './pages/lesson-learning/lesson-learning';
import { CoachingChat } from './pages/coaching-chat/coaching-chat';
import { InstructorLayout } from './layouts/instructor-layout/instructor-layout';
import { InstructorDashboard } from './pages/instructor/instructor-dashboard/instructor-dashboard';
import { InstructorTracks } from './pages/instructor/instructor-tracks/instructor-tracks';
import { InstructorAssignments } from './pages/instructor/instructor-assignments/instructor-assignments';
import { InstructorCalendar } from './pages/instructor/instructor-calendar/instructor-calendar';
import { InstructorInteractive } from './pages/instructor/instructor-interactive/instructor-interactive';
import { InstructorWorkshops } from './pages/instructor/instructor-workshops/instructor-workshops';
import { InstructorChat } from './pages/instructor/instructor-chat/instructor-chat';
import { InstructorProfile } from './pages/instructor/instructor-profile/instructor-profile';
import { InstructorTrackLessons } from './pages/instructor-track-lessons/instructor-track-lessons';
import { StudentCalendar } from './pages/student/student-calendar/student-calendar';
import{StudentAssignment} from'./pages/student/student-assignment/student-assignment'
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { Status } from './pages/student/status/status';
import { AdminDashboard } from './pages/admin/admin-dashboard/admin-dashboard';
import { AdminBookingRequest } from './pages/admin/admin-booking-request/admin-booking-request';
import { AdminTracks } from './pages/admin/admin-tracks/admin-tracks';
import { AdminInstructors } from './pages/admin/admin-instructors/admin-instructors';
import { AdminStudents } from './pages/admin/admin-students/admin-students';
import { AdminWorkshops } from './pages/admin/admin-workshops/admin-workshops';
import { AdminInteractive } from './pages/admin/admin-interactive/admin-interactive';
import { AdminProfile } from './pages/admin/admin-profile/admin-profile';
import { InstructorQuize } from './pages/instructor/instructor-quize/instructor-quize';
import { EndOfLessonQuiz } from './pages/student/end-of-lesson-quiz/end-of-lesson-quiz';
import { PrerequisiteQuiz } from './pages/student/prerequisite-quiz/prerequisite-quiz';
import { CertificateComponent } from './pages/student/certificate/certificate';
export const routes: Routes = [
  // Student/public pages
  {
    path: '',
    component: Home
  },
   { path: 'coaching/:trackId',
   component: CoachingChat },
  {
    path: 'track/:id',
    component: TrackDetails
  },
  {
    path: 'register',
    component: Register
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'booking/track/:id',
    component: TrackBooking
  },
  {
    path: 'learn/lesson/:id',
    component: LessonLearning
  },
{
  path: 'learn/lesson/:lessonId/quiz',
  component: EndOfLessonQuiz
},
{
  path: 'learn/lesson/:lessonId/prerequisite/:quizId',
  component: PrerequisiteQuiz
},
{
  path: 'track/:trackId/certificate',
  component: CertificateComponent
},
  // Instructor area: shared layout and sidebar
{
  path: 'instructor',
  component: InstructorLayout,
  children: [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: InstructorDashboard },
    { path: 'tracks', component: InstructorTracks },
    { path: 'assignments', component: InstructorAssignments },
    { path: 'calendar', component: InstructorCalendar },
    { path: 'interactive', component: InstructorInteractive },
    { path: 'workshops', component: InstructorWorkshops },
    { path: 'chat', component: InstructorChat },
    { path: 'profile', component: InstructorProfile },
    { path: 'quize', component: InstructorQuize },
    {
      path: 'tracks/:id/lessons',
      component: InstructorTrackLessons
    }
  ]
},{
  path: 'student/profile',
  component: StudentProfile
},
{
  path: 'student/calendar',
  component: StudentCalendar
},{
  path: 'student/status',
  component: Status
},
{
  path: 'learn/lesson/:id/assignment',
   component: StudentAssignment
},

{
  path: 'admin',
  component: AdminLayout,
  children: [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: AdminDashboard },
    { path: 'bookings', component: AdminBookingRequest },
    { path: 'tracks', component: AdminTracks },
    { path: 'instructors', component: AdminInstructors },
    { path: 'students', component: AdminStudents },
    { path: 'workshops', component: AdminWorkshops },
    { path: 'interactive', component: AdminInteractive },
    { path: 'profile', component: AdminProfile }
  ]
}
,
  // Unknown URLs return to home
  {
    path: '**',
    redirectTo: ''
  }
];
