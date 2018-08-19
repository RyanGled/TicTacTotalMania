import { Component } from '@angular/core';
import { MatDialog, MatDialogConfig } from '../../node_modules/@angular/material';

import { Web3Service } from './services/web3.service';
import { MersenneTwister } from '../../../core/mersenne-twister';

import { MutationDialogComponent } from './dialogs/mutation.modal.component';
import { JoinGameDialogComponent } from './dialogs/join-game.modal.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

    public ethBalance: string;
    private rng: MersenneTwister;
    private TicTacTotalMania: any;
    private activeContract: any;
    private gameInProgress: boolean = false;
    private boardSizeX: number[];
    private boardSizeY: number[];
    private playerNum: number;
    private playerMarker: string;
    private playerColor: string;
    private isMining: boolean = true;

    constructor(
      public dialog: MatDialog,
      private _web3Service: Web3Service) {
        //Poll for web3 object ready
        const getWeb3Ready = setInterval(() => {
            if (this._web3Service.GetIsWeb3Ready()) {
                clearInterval(getWeb3Ready);
                this._web3Service.GetEthBalance()
                    .then(value => this.ethBalance = value);
            }
        }, 100);

        this.CreateBoardSize();
        this.playerNum === 1 ? this.playerColor = 'rgb(51,153,254)' : this.playerColor = 'rgb(223,142,25)';
    }
    
    private CreateBoardSize(): void {
      const ySize = 3,
            xSize = 3
            this.playerNum = 1,
            this.playerMarker = 'X';
      this.boardSizeX = Array(xSize).fill(1).map((x, i) => i + 1);
      this.boardSizeY = Array(ySize).fill(1).map((x, i) => i + 1);
    }
    
    public CreateGame(): void {
      //Show dialog asking whether they would like to play with mutations
      const dialogConfig = new MatDialogConfig();
      dialogConfig.autoFocus = false;

      const mutationDialog = this.dialog.open(MutationDialogComponent);
      mutationDialog.afterClosed().subscribe(mutations => {
        this.InitContract(mutations);
      })
    }
    
    public JoinGame(): void {
      const dialogConfig = new MatDialogConfig();
      dialogConfig.autoFocus = false;

      const joinGameDialog = this.dialog.open(JoinGameDialogComponent);
      joinGameDialog.afterClosed().subscribe(address => {
        this.Join(address);
      })
    }

    private async InitContract(mutationsActive: boolean = false) {
      this.isMining = true;
      const contractAbi = require("../../../build/contracts/TicTacTotalMania.json");
      this.activeContract = await this._web3Service.DeployContract(contractAbi, 100000000000000000);
      console.log('activeContract' , this.activeContract);
      this.gameInProgress = true;
      this.isMining = false;
    }

    private Join(address: string): void {

    }

    private ShowMarker(event: MouseEvent): void {
      (event.target as HTMLElement).getElementsByTagName('p')[0].innerText = this.playerMarker;
      (event.target as HTMLElement).getElementsByTagName('p')[0].classList.add(this.playerNum.toString());
    }

    private DestroyMarkers(event: MouseEvent): void {
      (event.target as HTMLElement).getElementsByTagName('p')[0].innerText = '';
    }

    public PlacePiece(): void {
      // this.TicTacTotalMania.
    }

    // Flip(): void {
    //   this.rng = new MersenneTwister();
    //   console.log(this.rng.random());
    // }

}
