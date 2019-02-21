

export class Car {
  public static PORSCHE919 = new Car(100,"Porsche 919", "porsche919", 116);
  public static HDP = new Car(39, "HPD ARX-01c", "hpdarx", 40);

  public static list: Car[]  = [];

  constructor(private _id: number, private _name: string, private _fileId: string, private _classId: number){
    if(!Array.isArray(Car.list) || !Car.list.length){
      console.log("not array")
      Car.list = new Array(this);
    } else {
      console.log("push")
      Car.list.push(this);
      console.log(Car.list.length);
    }
  }

  get id() {
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


  public static cars(): Car[] {
    console.log(this.list.length);
    return this.list;
  }

}

console.log("919:" + Car.PORSCHE919.name);
console.log(Car.cars());






