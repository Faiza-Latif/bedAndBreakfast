import { Subscription } from 'rxjs';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Place } from '../../place.model';
import { PlacesService } from '../../places.service';
import { NavController, LoadingController, AlertController } from '@ionic/angular';

@Component({
  selector: 'app-edit-offer',
  templateUrl: './edit-offer.page.html',
  styleUrls: ['./edit-offer.page.scss'],
})
export class EditOfferPage implements OnInit, OnDestroy {
  place: Place;
  form: FormGroup;
  isLoading = false;
  placeId: string;
  private subscription: Subscription;
  constructor(
    private activatedRoute: ActivatedRoute,
    private placeServices: PlacesService,
    private navCtrl: NavController,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController) { }

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe(param => {
      if (!param.has('placeId')) {
        this.navCtrl.navigateBack('/places/tabs/offers');
        return;
      }
      this.placeId = param.get('placeId');
      this.isLoading = true;
      this.subscription = this.placeServices.getPlace(param.get('placeId')).subscribe(place => {
        this.place = place;
        this.form = new FormGroup({
          title: new FormControl(this.place.title, {
            validators: [Validators.required]
          }),
          description: new FormControl(this.place.description, {
            validators: [Validators.required, Validators.maxLength(180)]
          }),
        });
        this.isLoading = false;
      }, error => {
        this.alertCtrl.create({
          header: 'An error has occurred',
          message: 'Place could not be found. Please try again later',
          buttons: [{ text: 'Okay', handler: () => { this.router.navigate(['places/tabs/offers']); }}]
        })
          .then(alertEl => {
            alertEl.present();
          });
      });
    });

  }

  onUpdateOffer() {
    if (!this.form.valid) {
      return;
    }
    //only when the object array is changed, the subscription will emit a value
    //i need to receive a new list instead of changing the attributes of an item on the list
    this.loadingCtrl.create({ message: 'Editing Offer' }).then(loadingEl => {
      loadingEl.present();
      this.placeServices.updatePlace(this.place.id, this.form.value.title, this.form.value.description).subscribe(() => {
        this.form.reset();
        this.loadingCtrl.dismiss();
        this.router.navigateByUrl('/places/tabs/offers');
      });
    }
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

}
