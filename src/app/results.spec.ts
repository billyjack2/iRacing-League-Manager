import { ResultsEntry } from './results';
import {Car} from "./cars";
import {Driver} from "./driver";
import {async, TestBed} from "@angular/core/testing";
import {RouterTestingModule} from "@angular/router/testing";
import {AppComponent} from "./app.component";

describe('resultEntry', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
      declarations: [
        AppComponent
      ],
    }).compileComponents();
  }));

  it('should create an instance', () => {
    expect(new ResultsEntry(1,
      new Car(100,"Porsche 919", "porsche919", 116),
      new Driver("Billy Smith", 24410),
      1, 70, "Running", 0.0, 5, 0)).toBeTruthy();
  });
});
