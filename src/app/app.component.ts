import { Component } from '@angular/core';
import  "./cars";

import { AmplifyService } from "aws-amplify-angular";
//import {AuthState} from "aws-amplify-angular/dist/src/providers";
//import Analytics  from 'aws-amplify';
import Auth from '@aws-amplify/auth';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'iracingLeagueManager';

  private authenticated: any = null;
  private user: any = null;

  constructor( public amplify:AmplifyService ){

    this.amplify.authStateChange$.subscribe(authState => {
      this.authenticated = authState.state === 'signedIn';
      if (!authState.user) {
        this.user = null;
      } else {
        this.user = authState.user;
      }
    })

    console.log(this.authenticated);
    console.log(this.user);
  }

}

Auth.signUp({
  username: 'test user',
  password: 'Test1',
  attributes: {
    email: 'billy.j.smith2@gmail.com'
  }
});

Auth.signIn('test user', 'Test1')
  .then(success => console.log('successful log in'))
  .catch(err => console.log(err));


