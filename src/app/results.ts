import {Car} from "./cars";
import {Driver} from "./driver";

export class Results{

  private _resultEntries: ResultsEntry[] = new Array();

  constructor(private _leagueName: string, private _leagueId: string, resultEntries?: ResultsEntry[]){
    if(resultEntries) {
      this._resultEntries = resultEntries;
    }
  }


  get leagueName(): string {
    return this._leagueName;

  }

  get leagueId(): string {
    return this._leagueId;
  }

  public getFinisher(finishPos: number){
    return this._resultEntries.filter((result: ResultsEntry) => result)
  }

  public addResultEntry(entry?: ResultsEntry, entries?: ResultsEntry[]){

    if(entry) {
      this._resultEntries.push(entry);
    }else if(entries){
      this._resultEntries.push();
    }
  }

}

export class ResultsEntry{

  constructor(private _finish: number, private _car:Car, private _driver:Driver, private _startPos: number,
              private _carNum: number, private _out:string, private _interval: number, private _lapsLed: number,
              private _incCount: number){

  }

  get finish(){
    return this._finish;
  }

  get car(){
    return this._car;
  }

  get driver(){
    return this._driver;
  }

  get incCount(){
    return this._incCount;
  }

  get startPos(){
    return this._startPos;
  }

  get finished(): boolean {
    return this._out === "Running";
  }

  get carNum(): number {
    return this._carNum;
  }

  get interval(): number {
    return this._interval;
  }

  get lapsLed(): number {
    return this._lapsLed;
  }


}
