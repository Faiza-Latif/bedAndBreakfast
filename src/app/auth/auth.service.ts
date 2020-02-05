import { Plugins } from '@capacitor/core';
import { User } from './user.model';
import { environment } from './../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { map, tap, take } from 'rxjs/operators';


export interface AuthResponse {
  kind: string;
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  // sign up null, sign in mandatory
  registered?: boolean;
}

/**
 * A token should be managed by a behaviour subject,
 * so that when it changes we can tell the entire application
 */

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  private _user = new BehaviorSubject<User>(null);
  private activeLogoutTimer: any;

  constructor(private http: HttpClient) { }

  get userIsAuthenticated() {
    return this._user.asObservable()
      .pipe(
        // i dont want to return the full user, just want to see if its authenticated, use map to transform the data
        // !! to force a boolean.
        map(user => {
          if (user) {
            return !!user.token;
          } else {
            return false;
          }
        })
      );
  }

  get userId() {
    return this._user.asObservable()
      .pipe(
        map(user => {
          if (user) {
            return user.id;
          } else {
            return null;
          }
        })
      );
  }

  get token() {
    return this._user.asObservable()
      .pipe(
        map(user => {
          if (user) {
            return user.token;
          } else {
            return null;
          }
        })
      );
  }

  createUser(email: string, password: string) {
    // create a new email and password user with signupNewUser
    return this.http.post<AuthResponse>(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${environment.firebaseApiKey}`,
      {
        email,
        password,
        returnSecureToken: true
      })
      .pipe(
        // execute code
        tap(this.setUserData.bind(this))
      );
  }

  login(email: string, password: string) {
    // sign in a user with an email and password
    // Auth response is the data i'm expecting to receive
    return this.http
      .post<AuthResponse>(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.firebaseApiKey}`,
        {
          email,
          password,
          returnSecureToken: true
        })
      .pipe(
        /**
         * execute code but don't want to execute while i'm parsing this.
         * so just pass a reference. and the bind is so that the data comes from the service
         */
        tap(this.setUserData.bind(this))
      );
  }

  private setUserData(userData: AuthResponse) {
    // responseData.expiresIn number of seconds in which the id expires 3600
    const expirationToken = new Date(new Date().getTime() + +userData.expiresIn * 1000);
    const newUser = new User(userData.localId, userData.email, userData.idToken, expirationToken);
    this._user.next(newUser);
    this.autoLogout(newUser.tokenDuration);
    this.storeAuthData(userData.localId, userData.idToken, expirationToken.toISOString(), userData.email);
  }

  private storeAuthData(userId: string, token: string, tokenExpirationData: string, email: string) {
    const data = JSON.stringify({ userId, token, tokenExpirationData, email });
    Plugins.Storage.set({ key: 'authData', value: data });
  }

  private autoLogout(duration: number) {
    if (this.activeLogoutTimer) {
      clearTimeout(this.activeLogoutTimer);
    }
    this.activeLogoutTimer = setTimeout(() => {
      this.logout();
    }, duration);
  }

  autoLogin(): Observable<boolean>{
    // whenever the app restarts
    // Plugins.Storage.get({key: 'authData'}); returns a promise
    // from takes a promise and manages the listening and converts to observable
    return from(Plugins.Storage.get({ key: 'authData' }))
      .pipe(
        take(1),
        map(storedData => {
          if (!storedData || !storedData.value) {
            return null;
          }
          // the order of the properties does not matter
          const parseData = JSON.parse(storedData.value) as { userId: string; token: string; tokenExpirationData: string; email: string; };
          const expirationTime = new Date(parseData.tokenExpirationData);
          if (expirationTime <= new Date()) {
            console.log('expired token!');
            return null;
          }
          const user = new User(parseData.userId, parseData.email, parseData.token, expirationTime);
          return user;
        }),
        tap(user => {
          if (user) {
            this._user.next(user);
            this.autoLogout(user.tokenDuration);
          }
        }),
        map((user) => {
          // because tap doesn't consume the data, doesnt change it
          return !!user;
        })
      );
  }

  logout() {
    this._user.next(null);
    // clear data from storage
    Plugins.Storage.remove({key: 'authData'});
  }

  ngOnDestroy() {
    if (this.activeLogoutTimer) {
      clearTimeout(this.activeLogoutTimer);
    }
  }
}
