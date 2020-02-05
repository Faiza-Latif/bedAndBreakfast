import { Platform } from '@ionic/angular';
import { Plugins, Capacitor, CameraSource, CameraResultType } from '@capacitor/core';
import { Component, OnInit, Output, ViewChild, ElementRef, Input } from '@angular/core';
import { EventEmitter } from '@angular/core';

@Component({
  selector: 'app-image-picker',
  templateUrl: './image-picker.component.html',
  styleUrls: ['./image-picker.component.scss'],
})
export class ImagePickerComponent implements OnInit {
  @ViewChild('filePicker', {static: false}) filePicker: ElementRef;
  @Output() imagePick = new EventEmitter<string | File>();
  @Input() showPreview = false;
  selectedImage: string;
  usePicker = false;
  constructor(private platform: Platform) { }

  onPickImage() {
    // open the device camera
       // fallback --> hybrid is on phones
    if (!Capacitor.isPluginAvailable('Camera')) {
      this.filePicker.nativeElement.click();
      return;
    }
    Plugins.Camera.getPhoto({
      quality: 50,
      source: CameraSource.Prompt,
      correctOrientation: true,
      height: 320,
      width: 200,
      resultType: CameraResultType.DataUrl
    })
    .then(image => {
      this.selectedImage = image.dataUrl;
      this.imagePick.emit(this.selectedImage);
    })
    .catch(err => {
      console.log(err);
      this.filePicker.nativeElement.click();
    }
      );

  }
  ngOnInit() {
    if (this.platform.is('mobile') && !this.platform.is('hybrid') || this.platform.is('desktop')){
      this.usePicker = true;
    }
  }
  onFileChosen(event) {
    const pickedFile = (event.target as HTMLInputElement).files[0];
    if (!pickedFile) {
      return;
    }
    const fr = new FileReader();
    fr.onload = () => {
      const dataUrl = fr.result.toString();
      this.selectedImage = dataUrl;
      this.imagePick.emit(pickedFile);
    };
    //async
    fr.readAsDataURL(pickedFile);
  }
}
