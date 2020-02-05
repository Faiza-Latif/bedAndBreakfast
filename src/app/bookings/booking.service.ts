import { AuthService } from './../auth/auth.service';
import { Injectable } from '@angular/core';
import { Booking } from './booking.model';
import { BehaviorSubject, of } from 'rxjs';
import { tap, take, delay, switchMap, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

interface BookingData {
    bookedFrom: string;
    bookedTo: string;
    guestNumber: number;
    firstName: string;
    lastName: string;
    placeId: string;
    placeImage: string;
    placeTitle: string;
    userId: string;
}
@Injectable({ providedIn: 'root' })
export class BookingService {
    constructor(private authService: AuthService,
        private http: HttpClient) { }
    private _bookings = new BehaviorSubject<Booking[]>([]);

    get bookings() {
        return this._bookings.asObservable();
    }

    addBooking(placeId, placeTitle, placeImage, firstName, lastName, guestNumber, dateFrom, dateTo) {
        let generatedId: string;
        let newBooking;
        let fetchedUserId;
        return this.authService.userId
            .pipe(take(1),
                switchMap(userId => {
                    fetchedUserId = userId;
                    return this.authService.token;
                }),
                take(1),
                switchMap(token => {
                    if (!fetchedUserId) {
                        throw new Error('No user id found!');
                    }
                    newBooking = new Booking(
                        Math.random().toString(),
                        placeId,
                        fetchedUserId,
                        placeTitle,
                        placeImage,
                        guestNumber,
                        firstName,
                        lastName,
                        dateFrom,
                        dateTo);
                    return this.http
                        .post<{ name: string }>(`https://bedandbreakfast-48971.firebaseio.com/bookings.json?auth=${token}`,
                            { ...newBooking, id: null });
                }), switchMap(responseData => {
                    console.log('booking' + responseData);
                    generatedId = responseData.name;
                    return this.bookings;
                }),
                take(1),
                tap(bookings => {
                    newBooking.id = generatedId;
                    this._bookings.next(bookings.concat(newBooking));
                })
            );

    }
    fetchBookings() {
        //dynamic keys and the value of the keys will be of type BookingData
        let fetchedUserId;

        return this.authService.userId
        .pipe(take(1),
                switchMap(userId => {
                    fetchedUserId = userId;
                    return this.authService.token;
                }),
                take(1),
            switchMap(token => {
                return this.http
                    .get<{ [key: string]: BookingData }>
                    // tslint:disable-next-line: max-line-length
                    (`https://bedandbreakfast-48971.firebaseio.com/bookings.json?orderBy="userId"&equalTo="${fetchedUserId}"&auth=${token}`);

            }), map(bookingData => {
                const fetchedBookings = [];
                for (const key in bookingData) {
                    if (bookingData.hasOwnProperty(key)) {
                        fetchedBookings.push(
                            new Booking(key, bookingData[key].placeId,
                                bookingData[key].userId, bookingData[key].placeTitle, bookingData[key].placeImage,
                                +bookingData[key].guestNumber, bookingData[key].firstName, bookingData[key].lastName,
                                new Date(bookingData[key].bookedFrom),
                                new Date(bookingData[key].bookedTo)));
                    }
                }
                return fetchedBookings;
            }), tap(bookings => {
                this._bookings.next(bookings);
            })
        );
    }

    cancelBooking(bookingId) {
        // return this.bookings.pipe(
        //     take(1),
        //     delay(1000),
        //     tap(bookings => {
        //         this._bookings.next(bookings.filter(booking => booking.id !== bookingId));
        //     })
        // );
        // delete on server and then in local
        return this.authService.token.pipe(take(1),
        switchMap(token => {
            return this.http.delete(`https://bedandbreakfast-48971.firebaseio.com/bookings/${bookingId}.json?auth=${token}`);
        }), switchMap(() => {
                    return this.bookings;
                }),
                take(1),
                tap(bookings => {
                    this._bookings.next(bookings.filter(booking => booking.id !== bookingId));
                })
            );

    }
}
