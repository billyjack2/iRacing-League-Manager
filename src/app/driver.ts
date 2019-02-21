export class Driver{

  constructor(private _driverName: string, private _id: number){

  }

  get driverName(){
    return this._driverName;
  }

  get id(){
    return this._id;
  }
}
