import { take, tap, switchMap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import {  CanLoad, Route, UrlSegment, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanLoad {
  constructor(private authService: AuthService, private router: Router) {}
  canLoad(route: Route, segments: UrlSegment[]): Observable<boolean> | Promise<boolean> | boolean {
    return this.authService.userIsAuthenticated.pipe(
      take(1),
      switchMap((isAuthenticated: boolean) => {
        if (!isAuthenticated) {
          return this.authService.autoLogin();
        } else {
           return of(isAuthenticated);
        }
      }),
      tap(isAuthenticated => {
        if (!isAuthenticated) {
          this.router.navigateByUrl('/auth');
        }
      })
    );
  }

}

/**
 *  can activate: code for the lazyloading gets downloaded before the guard executes
 *  
 */