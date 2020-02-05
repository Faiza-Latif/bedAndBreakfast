import { AuthService } from './../../auth/auth.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { PlacesService } from '../places.service';
import { Place } from '../place.model';
import { MenuController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-discover',
  templateUrl: './discover.page.html',
  styleUrls: ['./discover.page.scss'],
})
export class DiscoverPage implements OnInit, OnDestroy {
  places: Place[];
  relevantPlaces: Place[];
  listedLoadedPlaces: Place[];
  private subscription: Subscription;
  isLoading = false;
  constructor(private placesService: PlacesService, private menuCtrl: MenuController, private authService: AuthService) { }

  ngOnInit() {
    this.subscription = this.placesService.places.subscribe(places => {
      this.places = places;
      this.relevantPlaces = this.places;
      this.listedLoadedPlaces = this.relevantPlaces.slice(1);
    });
  }

  ionViewWillEnter() {
    this.isLoading = true;
    this.placesService.fetchPlaces().subscribe(() => {
       this.isLoading = false;
     });
    }

  // ionViewDidEnter() {
  //   this.places = this.placesService.places;
  // }

  onFilterUpdate(event: CustomEvent) {
    this.authService.userId.pipe(take(1)).subscribe(id => {
      if (event.detail.value === 'all') {
          this.relevantPlaces = this.places;
          this.listedLoadedPlaces = this.relevantPlaces.slice(1);
      } else {
          this.relevantPlaces = this.places.filter(place => place.userId !== id);
          this.listedLoadedPlaces = this.relevantPlaces.slice(1);
      }
    });
  }
  // Note: another way to open menu
  // openMenu() {
  //   this.menuCtrl.toggle('m1');
  // }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
