import { Component } from '@angular/core';

import { Web3Service } from './services/web3.service';
import { MersenneTwister } from '../../../core/mersenne-twister';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

    public ethBalance: string;
    private rng: MersenneTwister;

    constructor(private _web3Service: Web3Service) {
        //Poll for web3 object ready

        const getWeb3Ready = setInterval(() => {
            if (this._web3Service.GetIsWeb3Ready()) {
                clearInterval(getWeb3Ready);
                this._web3Service.GetEthBalance()
                    .then(value => this.ethBalance = value);                
            }
        }, 100)
    }

    Flip(): void {
      this.rng = new MersenneTwister();
      console.log(this.rng.random());
    }

}
