import { MapModalComponent } from './../../../shared/map-modal/map-modal.component';
import { AuthService } from './../../../auth/auth.service';
import { Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NavController, ModalController, ActionSheetController, LoadingController, AlertController } from '@ionic/angular';
import { Place } from '../../place.model';
import { PlacesService } from '../../places.service';
import { CreateBookingComponent } from '../../../bookings/create-booking/create-booking.component';
import { BookingService } from 'src/app/bookings/booking.service';
import { take, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-place-detail',
  templateUrl: './place-detail.page.html',
  styleUrls: ['./place-detail.page.scss'],
})
export class PlaceDetailPage implements OnInit, OnDestroy {
place: Place;
isBookable = true;
isLoading = false;
private subscription: Subscription;
  constructor(
    private activatedRoute: ActivatedRoute,
    private navCtrl: NavController,
    private placeServices: PlacesService,
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private bookingService: BookingService,
    private loadingCtrl: LoadingController,
    private authService: AuthService,
    private alertController: AlertController,
    private router: Router) {
    }

  ngOnInit() {

    this.activatedRoute.paramMap.subscribe(param => {
      if (!param.has('placeId')) {
        this.navCtrl.navigateBack('/places/tabs/discover');
      }
      this.isLoading = true;
      let userId;
      this.authService.userId
      .pipe(take(1),
      switchMap( id => {
        if (!id) {
          throw new Error('Found no id!');
        }
        userId = id;
        return this.placeServices.getPlace(param.get('placeId'));
      })).subscribe((place) => {
        this.place = place;
        this.isBookable = this.authService.userId === userId ? false : true;
        this.isLoading = false;
      }, error => {
        this.alertController.create({header: 'An error ocurred', message: 'Could not load place.',
        buttons: [{text: 'okay', handler: () => {
          this.router.navigate(['/places/tabs/discover']);
        }}]}).then(alertEl => alertEl.present());
      });
    });
  }

  /**
   * How to go to the previous Page?
   * 1. ion-back-button
   * 2. router (by default ionic makes the forward animation)
   * 3. usage of NavController to help with the animations (under the hood it used angular router)
   * 4. usage of Navcontroller with the pop method
   */
    // 2. this.router.navigateByUrl('/places/tabs/discover');
    // 3. this.navCtrl.navigateBack('places/tabs/discover');
    // 4. this.navCtrl.pop();
    // problems with (4) if we reload and there is no stack
  onBookPlace() {
    this.actionSheetCtrl.create({
      header: 'Choose an action',
      buttons: [
        {
          text: 'Select Date',
          handler: () => {
            this.openBookingModal('select');
          }

        },
        {
          text: 'Random Date',
          handler: () => {
            this.openBookingModal('random');
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    }).then(actionSheetEl => actionSheetEl.present());
  
  }

  openBookingModal(mode: 'select' | 'random') {
    this.modalCtrl.create({component: CreateBookingComponent, componentProps: {selectedPlace: this.place, selectedMode: mode}})
    .then((modalEl) => {
      modalEl.present();
      return modalEl.onDidDismiss();
    })
    .then(resultData => {
      //data that I receive from the modal
      console.log(resultData.data, resultData.role);
      if (resultData.role === 'confirm') {
      this.loadingCtrl
      .create({message: 'Creating booking'})
      .then((loadingEl) => {
        loadingEl.present();
        this.bookingService.addBooking(this.place.id, this.place.title, this.place.imageUrl,
          resultData.data.bookingData.firstName, resultData.data.bookingData.lastName, resultData.data.bookingData.guestNumber,
          resultData.data.bookingData.startDate, resultData.data.bookingData.endDate).subscribe(() => {
            loadingEl.dismiss();
          });
      });
      }
    });
  }

  onShowFullMap() {
    this.modalCtrl.create({component: MapModalComponent, componentProps:
    {
      center: { lat: this.place.location.lat, lng: this.place.location.lng },
      selectable: false,
      closeButtonText: 'Close',
      title: this.place.location.address
    }})
    .then(MapEl => {
      MapEl.present();
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

  }
}
