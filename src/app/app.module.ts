import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {Results, ResultsEntry} from "./results";
import {Car} from "./cars";
import {Driver} from "./driver";

//import Amplify from 'aws-amplify';
//import aws_exports from './aws-exports';

//Amplify.configure(aws_exports);


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {

  public test(){
    var result = new Results("test league", "5555");

    console.log(result);
    let car = new Car(100,"Porsche 919", "porsche919", 116);
    let driver = new Driver("Billy", 24410);
    result.addResultEntry(new ResultsEntry(1, car, driver, 1, 70, "Running", 0, 5, 0 ));

    console.log(result);

  }
}

var result = new Results("test league", "5555");

console.log(result);
let car = new Car(100,"Porsche 919", "porsche919", 116);
let driver = new Driver("Billy", 24410);
result.addResultEntry(new ResultsEntry(1, car, driver, 1, 70, "Running", 0, 5, 0 ));

console.log(result);

