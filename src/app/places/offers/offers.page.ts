import { Component, OnInit, OnDestroy } from '@angular/core';
import { Place } from '../place.model';
import { PlacesService } from '../places.service';
import { IonItemSliding } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-offers',
  templateUrl: './offers.page.html',
  styleUrls: ['./offers.page.scss'],
})
export class OffersPage implements OnInit, OnDestroy {
  offers: Place [];
  isLoading = false;
  private subscription: Subscription;
  constructor(private placesService: PlacesService,
              private router: Router) { }

  //this renders ONE time only and stays cached
  ngOnInit() {
    this.subscription = this.placesService.places.subscribe(places => {
      this.offers = places;
    });
  }

  ionViewWillEnter() {
  this.isLoading = true;
  this.placesService.fetchPlaces().subscribe(() => {
     this.isLoading = false;
   });
  }

  onEdit(offerId: string, slidingItem: IonItemSliding) {
    slidingItem.close();
    this.router.navigate(['/', 'places', 'tabs', 'offers', 'edit-offer', offerId]);
}
ngOnDestroy() {
  if(this.subscription) {
    this.subscription.unsubscribe();
  }
}
}
