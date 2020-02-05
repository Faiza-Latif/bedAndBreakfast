import { PlaceLocation } from './location.model';
import { Injectable } from '@angular/core';
import { Place } from './place.model';
import { AuthService } from '../auth/auth.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { take, map, tap, delay, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

interface PlaceData {
  availableFrom: string;
  availableTo: string;
  description: string;
  imageUrl: string;
  price: number;
  title: string;
  userId: string;
  location: PlaceLocation;
}
@Injectable({
  providedIn: 'root'
})
export class PlacesService {

  constructor(private authService: AuthService,
    private http: HttpClient) { }

  private _places = new BehaviorSubject<Place[]>([
    //   new Place(
    //     'p1',
    //     'Manhattan Mansion',
    //     'In the heart of New York',
    //     // tslint:disable-next-line: max-line-length
    //     'https://i.pinimg.com/originals/9a/fe/c3/9afec38b401d567cf9ccba161d3b30b5.jpg',
    //     200,
    //     new Date('2019-01-01'),
    //     new Date('2019-12-31'),
    //     'abc'
    //   ),
    //   new Place(
    //     'p2',
    //     `Portugal's delight`,
    //     'In the root of Portugal',
    //     // tslint:disable-next-line: max-line-length
    //     'https://images.mansionglobal.com/im-106304?width=640',
    //     100.99,
    //     new Date('2019-01-01'),
    //     new Date('2019-01-31'),
    //     'ebd'
    //   ),
  ]);

  get places() {
    return this._places.asObservable();
  }

  fetchPlaces() {
    //map doesnt return a new observable
    return this.authService.token.pipe(take(1),
      switchMap(token => {
        return this.http
          .get<{ [key: string]: PlaceData }>(`https://bedandbreakfast-48971.firebaseio.com/offered-places.json?auth=${token}`);
      }), map(
        placesData => {
          const places = [];
          for (const key in placesData) {
            if (placesData.hasOwnProperty(key)) {
              places.push(new Place(
                key,
                placesData[key].title,
                placesData[key].description,
                placesData[key].imageUrl,
                placesData[key].price,
                new Date(placesData[key].availableFrom),
                new Date(placesData[key].availableTo),
                placesData[key].userId,
                placesData[key].location
              ));
            }
          }
          return places;
        }),
      tap(places => {
        this._places.next(places);
      })
    );
  }

  getPlace(placeId: string): Observable<Place> {
    //the map here will get what the "take" returns -> places
    return this.authService.token.pipe(take(1),
      switchMap(token => {
        return this.http.get<PlaceData>(`https://bedandbreakfast-48971.firebaseio.com/offered-places/${placeId}.json?auth=${token}`);

      }),
      map((responseData => {
        return new Place(placeId, responseData.title, responseData.description, responseData.imageUrl, responseData.price,
          new Date(responseData.availableFrom), new Date(responseData.availableTo), responseData.userId, responseData.location);
      })
      )
    );
  }

  uploadImage(image: File) {
    const uploadData = new FormData();
    uploadData.append('image', image);
    return this.authService.token.pipe(take(1),
      switchMap(token => {
        return this.http
          .post<{ imageUrl: string, imagePath: string }>('https://us-central1-bedandbreakfast-48971.cloudfunctions.net/storeImage',
          uploadData,
          {headers: {Authorization: 'Bearer ' + token}});
      }));
  }


  addPlace(title: string, description: string, price: number,
    dateFrom: Date, dateTo: Date, placeLocation: PlaceLocation, imageUrl: string) {
    let generatedId: string;
    let newPlace: Place;
    let fetchedUserId;
    return this.authService.userId.pipe(
      take(1),
      switchMap(id => {
        fetchedUserId = id;
        return this.authService.token;
      }),
      take(1),
      switchMap(token => {
        newPlace = new Place(
          Math.random.toString(),
          title,
          description,
          imageUrl,
          price,
          dateFrom,
          dateTo,
          fetchedUserId,
          placeLocation
        );
        return this.http
          .post<{ name: string }>
          (`https://bedandbreakfast-48971.firebaseio.com/offered-places.json?auth=${token}`, { ...newPlace, id: null });
      }),
      switchMap(responseData => {
        generatedId = responseData.name;
        return this.places;
      }),
      take(1),
      tap(placesArray => {
        newPlace.id = generatedId;
        this._places.next(placesArray.concat(newPlace));
      }));
    //look at my places, subscribe to it, only take one object and cancel the subscription
    // tab => doesnt execute the observable but executes the action
    // delay => delays the subscription
    //switchMap => takes an existing oservable chain and it's result and returns a new observable

    // return this.places.pipe(take(1), delay(1000), tap(placesArray =>
    //   this._places.next(placesArray.concat(newPlace))
    // )
    // );
  }

  updatePlace(id: string, title: string, description: string) {
    // let placeToUpdate: Place;
    // this.getPlace(id).subscribe(place => {
    //   placeToUpdate = place
    // });
    // placeToUpdate.title = title;
    // placeToUpdate.description = description;
    // this.places.subscribe((data) => console.log(data));
    //THE TOP APPROACH IS NOT CHANGING THE ARRAY
    let updatedPlaces: Place[];
    let fetchedToken;
    return this.authService.token.pipe(
    take(1),
    switchMap(token => {
      fetchedToken = token;
      return this.places;
    }),
    take(1),
      switchMap(places => {
        if (!places || places.length <= 0) {
          return this.fetchPlaces();
        } else {
          return of(places);
        }
      }),
      switchMap(places => {
        const updatedPlaceIndex = places.findIndex(el => el.id === id);
        updatedPlaces = [...places];
        const oldPlace = updatedPlaces[updatedPlaceIndex];
        updatedPlaces[updatedPlaceIndex] = new Place(
          oldPlace.id,
          title,
          description,
          oldPlace.imageUrl,
          oldPlace.price,
          oldPlace.availableFrom,
          oldPlace.availableTo,
          oldPlace.userId,
          oldPlace.location);
        return this.http.put(`https://bedandbreakfast-48971.firebaseio.com/offered-places/${id}.json?auth=${fetchedToken}`,
          { ...updatedPlaces[updatedPlaceIndex], id: null });
      }), tap(() => {
        this._places.next(updatedPlaces);
      })
    );


    // return this.places.pipe(take(1), delay(1000), tap(places => {
    //   const updatedPlaceIndex = places.findIndex(el => el.id === id);
    //   const updatedPlaces = [...places];
    //   const oldPlace = updatedPlaces[updatedPlaceIndex];
    //   updatedPlaces[updatedPlaceIndex] = new Place(
    //     oldPlace.id,
    //     title,
    //     description,
    //     oldPlace.imageUrl,
    //     oldPlace.price,
    //     oldPlace.availableFrom,
    //     oldPlace.availableTo,
    //     oldPlace.userId);
    //   this._places.next(updatedPlaces);
    // })
    // );
  }


}
