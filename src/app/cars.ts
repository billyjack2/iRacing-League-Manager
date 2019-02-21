

export class Car {


  constructor(private _id: number, private _name: string, private _fileId: string, private _classId: number){

  }

  get id(): number {
    return this._id;
  }

  get name(){
    return this._name
  }

  get fileId(){
    return this._fileId
  }

  get classId(){
    return this._classId
  }




}


export class Cars{


  private static list: Car[]  = new Array(0);


  public static constructCars(){
    Cars.list.push(new Car(100,"Porsche 919", "porsche919", 116));
    Cars.list.push(new Car(39, "HPD ARX-01c", "hpdarx", 40));

  }

  public cars = (): Car[] =>  {
    console.log(Cars.list.length);
    return Cars.list;
  }

  public static cars1 = (): Car[] =>  {
    console.log(Cars.list.length);
    return Cars.list;
  }

  public static getCar = (id: number): Car => {
    //return Cars.list.filter((car: Car) => car._id === id);
    return Cars.list.find((car: Car) => car.id === id);
  }

}

//console.log(new Cars().cars());
Cars.constructCars();
console.log(Cars.getCar(100).name);
console.log(Cars.cars1());






