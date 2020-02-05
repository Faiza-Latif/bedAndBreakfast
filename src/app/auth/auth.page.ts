import { Observable } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { AuthService, AuthResponse } from './auth.service';
import { Router } from '@angular/router';
import { LoadingController, AlertController } from '@ionic/angular';
import { NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {
  isLoading = false;
  isLogin = true;

  constructor(private authService: AuthService, private route: Router,
    private loadingController: LoadingController, private alertCtrl: AlertController) { }

  ngOnInit() {
  }

  authenticate(email, password) {
    this.isLoading = true;
    if (!email || !password) {
      return null;
    }
    this.loadingController.create({
      keyboardClose: true,
      message: 'Logging in...'
    }).then(loadingEl => {
      loadingEl.present();
      // this will hold either the observable to sign in or to sign up
      let observable: Observable<AuthResponse>;
      if (this.isLogin) {
        observable = this.authService.login(email, password);
      } else {
        observable = this.authService.createUser(email, password);
      }
      observable.subscribe(responseData => {
        console.log(responseData);
        this.isLoading = false;
        loadingEl.dismiss();
        this.route.navigateByUrl('places/tabs/discover');
      }, (error: HttpErrorResponse) => {
        loadingEl.dismiss();
        let processedMessage = 'There was an error. Please try again later';
        const errorMessage = error.error.error.message;
        if (errorMessage === 'EMAIL_EXISTS') {
          processedMessage = 'This email address already exists!';
        } else if (errorMessage === 'EMAIL_NOT_FOUND') {
          processedMessage = 'This email address could not be found';
        } else if (errorMessage === 'INVALID_PASSWORD') {
          processedMessage = 'This password is not correct';
        }
        this.showAlert(processedMessage);
      });
    });
  }

  onSubmit(f: NgForm) {
    if (!f.valid) {
      return;
    }
    const email = f.value.email;
    const password = f.value.password;
    this.authenticate(email, password);
    f.reset();
  }

  onSwitchAuthMode() {
    this.isLogin = !this.isLogin;
  }

  showAlert(message: string) {
    this.alertCtrl.create({ header: 'Authentication Failed', message, buttons: ['Okay'] })
      .then(alertEl => alertEl.present());
  }
}
