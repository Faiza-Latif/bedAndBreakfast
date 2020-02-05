import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Place } from 'src/app/places/place.model';
import { ModalController } from '@ionic/angular';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-create-booking',
  templateUrl: './create-booking.component.html',
  styleUrls: ['./create-booking.component.scss'],
})
export class CreateBookingComponent implements OnInit {
  @Input()
  selectedPlace: Place;
  @Input()
  selectedMode: 'select' | 'random';
  startDate: string;
  endDate: string;

  //I need this because if i enter the TO before the FOR there is no way that i can validate that using directives.
  //static ---> true when i need to access this on ngOnInit
  @ViewChild('f', {static: false}) form: NgForm;
  
  constructor(private modalCtrl: ModalController) { }

  ngOnInit() {
    const availableFrom = new Date(this.selectedPlace.availableFrom);
    const availableTo = new Date(this.selectedPlace.availableTo);
    if (this.selectedMode === 'random') {
      // imaginando que começa a dia 12 e acaba a 25
      // 12 + random * 25-7 dias-12(de dia 1 a dia 12)
      this.startDate =
        new Date(availableFrom.getTime() + Math.random() *
          (availableTo.getTime() - 7 * 24 * 60 * 60 * 1000 - availableFrom.getTime()))
          .toISOString();
    }
    this.endDate =
    new Date(
      new Date(this.startDate).getTime()
      + Math.random()
      * (6 * 24 * 60 * 60 * 1000))
    .toISOString();

  }

  onBookPlace() {
    if (!this.form.valid || !this.datesValid()) {
      return;
    }
    //sends this info to who invoked him
    this.modalCtrl.dismiss({
      bookingData: {
        firstName: this.form.value['first-name'],
        lastName: this.form.value['last-name'],
        guestNumber: +this.form.value['guest-number'],
        startDate: new Date(this.form.value['date-from']),
        endDate: new Date(this.form.value['date-to'])
      }
     }, 'confirm');

  }
  onCancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  datesValid() {
    const startDate = new Date(this.form.value['date-from']);
    const endDate = new Date(this.form.value['date-to']);
    return endDate > startDate;
  }
}
