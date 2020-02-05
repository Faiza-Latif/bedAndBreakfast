import { Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { BookingService } from 'src/app/bookings/booking.service';
import { Booking } from './booking.model';
import { IonItemSliding, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.page.html',
  styleUrls: ['./bookings.page.scss'],
})
export class BookingsPage implements OnInit, OnDestroy {
  loadedBookings: Booking[];
  isLoading = false;
  constructor(private bookingService: BookingService,
    private loadingCtrl: LoadingController) { }
  private subscription: Subscription;

  ngOnInit() {
    this.subscription = this.bookingService.bookings.subscribe(bookings => {
      this.loadedBookings = bookings;
    });
  }

  ionViewWillEnter() {
    this.isLoading = true;
    this.bookingService.fetchBookings().subscribe(data => {
      this.isLoading = false;
    });
  }

  onCancelBooking(id: string, slidingBookingEl: IonItemSliding) {
    slidingBookingEl.close();
    this.loadingCtrl.create({ message: 'Cancelling...' })
      .then(loadingEl => {
        loadingEl.present();
        this.bookingService.cancelBooking(id).subscribe(() => {
          loadingEl.dismiss();
        });
      });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
