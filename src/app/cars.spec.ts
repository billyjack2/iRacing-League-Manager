import { Car } from './cars';

describe('Car', () => {
  it('should create an instance', () => {
    expect(new Car(100,"Porsche 919", "porsche919", 116)).toBeTruthy();
  });
});
