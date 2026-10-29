
import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  UrlTree
} from '@angular/router';
import { catchError, map, of, take } from 'rxjs';

import { AuthService } from '../auth';

export const adminGuard: CanActivateFn = (_route, state) => {
  console.log('ADMIN GUARD RAN:', state.url);

  // Keep the rest of your existing code unchanged.
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getCurrentUser().pipe(
    take(1),

    map((user): boolean | UrlTree => {
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

      if (isAdmin) {
        return true;
      }

      // The user is authenticated but doesn't have an admin role.
      return router.createUrlTree(['/']);
    }),

    catchError(error => {
      console.error(
        'Admin guard: Could not verify the current user.',
        error
      );

      // Preserve the requested URL so the user can return after login.
      return of(
        router.createUrlTree(['/login'], {
          queryParams: { returnUrl: state.url }
        })
      );
    })
  );
};
