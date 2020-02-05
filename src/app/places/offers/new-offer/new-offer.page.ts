import { PlaceLocation } from './../../location.model';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { PlacesService } from '../../places.service';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { switchMap } from 'rxjs/operators';

function base64toBlob(base64Data, contentType) {
  contentType = contentType || '';
  const sliceSize = 1024;
  const byteCharacters = window.atob(base64Data);
  const bytesLength = byteCharacters.length;
  const slicesCount = Math.ceil(bytesLength / sliceSize);
  const byteArrays = new Array(slicesCount);

  for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
    const begin = sliceIndex * sliceSize;
    const end = Math.min(begin + sliceSize, bytesLength);

    const bytes = new Array(end - begin);
    for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
      bytes[i] = byteCharacters[offset].charCodeAt(0);
    }
    byteArrays[sliceIndex] = new Uint8Array(bytes);
  }
  return new Blob(byteArrays, { type: contentType });
}

@Component({
  selector: 'app-new-offer',
  templateUrl: './new-offer.page.html',
  styleUrls: ['./new-offer.page.scss'],
})
export class NewOfferPage implements OnInit {
  form: FormGroup;
  constructor(
    private placeService: PlacesService,
    private router: Router,
    private loadingCtrl: LoadingController) { }

  ngOnInit() {
    this.form = new FormGroup({
      title: new FormControl(null, {
        validators: [Validators.required]}),
      description: new FormControl(null, {
        validators: [Validators.required, Validators.maxLength(180)]}),
      price: new FormControl(null, {
        validators: [Validators.required, Validators.min(1)]
      }),
      dateFrom:  new FormControl(null, {
        validators: [Validators.required]
      }),
      dateTo: new FormControl(null, {
        validators: [Validators.required]
      }),
      location: new FormControl(null, {
        validators: [Validators.required]
      }),
      image: new FormControl(null)
    });
  }

  onCreateOffer() {
    if (this.form && !this.form.valid || !this.form.get('image').value) {
      return;
    }
    console.log(this.form.value);
    this.loadingCtrl.create({
      message: 'Creating place...',
    }).then(loadingEl => {
      loadingEl.present();
      this.placeService.uploadImage(this.form.get('image').value)
      .pipe(
        switchMap(uploadResponse => {
          const value = this.form.value;
          return this.placeService.addPlace(
            value.title,
            value.description,
            +value.price,
            new Date(value.dateFrom),
            new Date(value.dateTo),
            value.location,
            uploadResponse.imageUrl,
            );
        })
      ).subscribe(() => {
        loadingEl.dismiss();
        this.form.reset();
        this.router.navigate(['/places/tabs/offers']);
      }, error => {
        loadingEl.dismiss();
        console.log(error);
      });
    });

  }

  onLocationPicked(location: PlaceLocation) {
    this.form.patchValue({ location: location });
  }

  onImagePicked(imageData: string | File) {
    let imageFile;
    if (typeof imageData === 'string') {
      try {
        // convert to file
        imageFile = base64toBlob(
          imageData.replace('data:image/png;base64,', ''),
          'image/jpeg'
        );
      } catch (error) {
        console.log(error);
        return;
      }
    } else {
      imageFile = imageData;
    }
    this.form.patchValue({ image: imageFile });
    console.log(this.form.value);
  }
}
