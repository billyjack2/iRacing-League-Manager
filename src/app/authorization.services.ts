
import { AuthenticationDetails, CognitoUser, CognitoUserPool } from 'amazon-cognito-identity-js'
import {Observable} from "rxjs";
import {Injectable} from "@angular/core";

const poolData = {
  UserPoolId: 'us-east-2_fP4u5DSaT',
  ClientId: '297fts505sjpv0du2lh2dl3tft',
};

const userPool = new CognitoUserPool(poolData);

@Injectable()
export class AuthorizationService {
  cognitoUser: any;

  constructor() {}

  register(email: any, password: any) {

    const attributeList: any[] = [];
    let userAttributes: any[] = [];

    return Observable.create((observer:any) => {
      userPool.signUp(email,password,attributeList, userAttributes, (err: any,result: any) => {
        if (err){
          console.log("signup error", err);
          observer.error(err);
        }

        this.cognitoUser = result.user;
        console.log("signup success", result);
        observer.next(result);
        observer.complete();
      });
    });
  }

  confirmAuthCode(code: any){
    const user = {
      Username: this.cognitoUser.username,
      Pool : userPool
    };
    return Observable.create((observer:any) => {
      const cognitoUser = new CognitoUser(user);
      cognitoUser.confirmRegistration(code, true, function(err, result){
        if (err) {
          console.log(err);
          observer.error(err);
        }
        console.log("confirmAuthCode() success", result);
        observer.next(result);
        observer.complete();
      });
    });
  }

  signIn(email:any, password:any) {

    const authenticationData = {
      Username: email,
      Password: password,
    };
    const authenticationDetails : AuthenticationDetails = new AuthenticationDetails(authenticationData);

    const userData = {
      Username: email,
      Pool: userPool
    };
    const cognitoUser: CognitoUser = new CognitoUser(userData);

    return Observable.create((observer:any) => {

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {

          //console.log(result);
          observer.next(result);
          observer.complete();
        },
        onFailure: function (err) {
          console.log(err);
          observer.error(err);

        },
      });
    });
  }

  isLoggedIn() {
    return userPool.getCurrentUser() != null;
  }

  getAuthenticatedUser(){
    // gets the current user from the local storage
    return userPool.getCurrentUser();
  }

  logOut(){
    if(userPool.getCurrentUser() != null) {
      this.getAuthenticatedUser()!.signOut();
      this.cognitoUser = null;
    }
  }

}
