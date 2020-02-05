import { ModalController } from '@ionic/angular';
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Renderer2, OnDestroy, Input } from '@angular/core';

@Component({
  selector: 'app-map-modal',
  templateUrl: './map-modal.component.html',
  styleUrls: ['./map-modal.component.scss'],
})
export class MapModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('map', { static: false }) mapElement: ElementRef;

  // Defaults
  @Input() center = { lat: -34.397, lng: 150.644 };
  @Input() selectable = true;
  @Input() closeButtonText = 'Cancel';
  @Input() title = 'Pick Location';
  clickListener: any;
  googleMaps: any;
  constructor(private modalCtrl: ModalController, private renderer: Renderer2) { }

  ngOnInit() { }

  // to interact with the view
  ngAfterViewInit() {
    this.getGoogleMaps()
      .then(googleMaps => {
        const mapEl = this.mapElement.nativeElement;
        const map = new googleMaps.Map(mapEl, {
          center: this.center,
          zoom: 16
        });
        this.googleMaps = googleMaps.event.addListenerOnce(map, 'idle', () => {
          this.renderer.addClass(mapEl, 'visible');
        });
        if (this.selectable) {
          this.clickListener = map.addListener('click', event => {
            console.log(event);
            const selectedCoords = {
              lat: event.latLng.lat(), lng: event.latLng.lng()
            };
            this.modalCtrl.dismiss(selectedCoords);
          });
        } else {
          const marker = new googleMaps.Marker({
            position: this.center,
            map: map,
            title: 'Picked location'
          });
          marker.setMap(map);
        }
      })
      .catch(err => {
        console.log(err);
      });
  }
  onCancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  private getGoogleMaps() {
    // refers to our browser window
    const win = window as any;
    // it win.google is not set in the first call
    const googleModule = win.google;
    // if it exists i don't want to get this all over again.
    // I will return a promise because if the google maps is not loaded yet, it returns a promise
    if (googleModule && googleModule.maps) {
      return Promise.resolve(googleModule.maps);
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDPlwuMDOYiRTUYM1AtPea2sgVk9V4NpVw';
      script.type = 'text/javascript';
      script.async = true;
      script.defer = true;
      //next to the app-root BUT NOT INSIDE
      document.body.append(script);
      script.onload = () => {
        const loadedGoogleModule = win.google;
        if (loadedGoogleModule && loadedGoogleModule.maps) {
          resolve(loadedGoogleModule.maps);
        } else {
          reject('Google Maps SDK not available');
        }
      };
    });
  }

  ngOnDestroy() {
    if (this.googleMaps && this.googleMaps.event && this.clickListener) {
      this.googleMaps.event.removeListener(this.clickListener);
    }
  }
}
