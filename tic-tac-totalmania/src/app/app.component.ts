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
    private activeAccount: string;
    private contractAbi: JSON;
    private TicTacTotalMania: any;
    private activeContract: any;
    private gameInProgress: boolean = false;
    private boardSizeX: number[];
    private boardSizeY: number[];
    private isMining: boolean = false;
    private connectedNetwork: string;
    private txUrl: string;
    private contractAddress: string;

    private playerOne: string;
    private playerTwo: string;
    private playerNum: number;
    private playerMarker: string;
    private playerColor: string;
    private currActivePlayer: string;
    private isMyTurn: boolean = false;

    constructor(
      public dialog: MatDialog,
      private _web3Service: Web3Service) {
        //Poll for web3 object ready
        const getWeb3Ready = setInterval(() => {            
            if (this._web3Service.GetIsWeb3Ready()) {
                clearInterval(getWeb3Ready);
                this._web3Service.GetEthBalance()
                  .then(value => this.ethBalance = value);
                this._web3Service.GetEthNetwork()
                  .then(network => this.connectedNetwork = network);
            }
        }, 100);

        this.InitOrRetrieveGame();
        this.playerNum === 1 ? this.playerColor = 'rgb(51,153,254)' : this.playerColor = 'rgb(223,142,25)';
    }

    private async InitOrRetrieveGame() {
      await this.GetContractAbi();
      await this._web3Service.RetrieveEthAccounts();
      this.activeAccount = await this._web3Service.GetActiveAccount();
      const isGameInProgress = localStorage.getItem('gameInProg');
      this.contractAddress = localStorage.getItem('contractAddress');
      if (isGameInProgress) {
        this.activeContract = JSON.parse(isGameInProgress);        
        this.gameInProgress = true;
        this.activeContract = await this._web3Service.GetContractInstance(
          this.contractAbi, 
          this.contractAddress
        );
        const playerTwo = await this.activeContract.methods.secondPlayer().call();
        console.log('playerTwo', playerTwo);
        console.log('this.activeContract', this.activeContract);
        this.GetPlayerDetails();
      }
      this.CreateBoardSize();
    }
    
    private async CreateBoardSize() {
      let ySize,
          xSize;
      if (this.gameInProgress) {
        const gameBoard = await this.activeContract.methods.returnBoard().call();
        ySize = gameBoard.length,
        xSize = gameBoard.length;
      } else {
        ySize = 3,
        xSize = 3;
      }
      
      this.boardSizeX = Array(xSize).fill(1).map((x, i) => i + 1);
      this.boardSizeY = Array(ySize).fill(1).map((x, i) => i + 1);
    }

    private async GetPlayerDetails() {
      const playerOne = await this.activeContract.methods.firstPlayer().call();
      
      if (playerOne === this.activeAccount) {
        this.playerNum = 1;
        this.playerMarker = 'X';
      }
      const playerTwo = await this.activeContract.methods.secondPlayer().call();      
      if (playerTwo === this.activeAccount) {
        this.playerNum = 2;
        this.playerMarker = 'O';
      }
      this.GetCurrentPlayersTurn();
    }

    private async GetCurrentPlayersTurn() {
      this.currActivePlayer = await this.activeContract.methods.currActivePlayer().call();
      console.log('this.currActivePlayer', this.currActivePlayer);
      console.log('this.activeAccount', this.activeAccount);
      
      if (this.currActivePlayer === this.activeAccount)
        this.isMyTurn = true;
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
      joinGameDialog.componentInstance.closeAndJoin.subscribe(address => {
        this.Join(address);
      })
    }

    private async InitContract(mutationsActive: boolean = false) {
      this.isMining = true;
      this.activeContract = await this.DeployContract(this.contractAbi, 10000000000000000);      
      this.gameInProgress = true;
      this.isMining = false;
      console.log('this.activeContract', this.activeContract);
      
      localStorage.setItem('gameInProg', JSON.stringify(this.activeContract));
    }

    private async DeployContract(abi: any, constructorVal: number = 0): Promise<ContractDeploy> {
      let contractReturn: ContractDeploy = {
        txHash: null,
        receipt: null,
        confirmation: null
      }

      const contract = await new (<any>window).web3.eth.Contract(abi.abi)
        .deploy({data: abi.bytecode})
        .send({from: this.activeAccount, value: constructorVal},
        (error, txHash) => {})
          .on('error', (error) => { 
            console.error('error', error); 
            // window.location.reload(); 
          })
          .on('transactionHash', (transactionHash) => { 
            console.log('transactionHash', transactionHash);
            contractReturn.txHash = transactionHash;
            this.txUrl = `https://${this.connectedNetwork}.etherscan.io/tx/${transactionHash}`;
          })
          .on('receipt', function(receipt) {
            console.log('receipt', receipt.contractAddress);
            contractReturn.receipt = receipt;
            localStorage.setItem('contractAddress', receipt.contractAddress);
          })
          .on('confirmation', (confirmationNumber, receipt) => { 
            console.log('confirmationNumber', confirmationNumber); 
            console.log('receipt', receipt);
            contractReturn.confirmation = confirmationNumber;
            contractReturn.receipt = receipt;
          });
        
      return contractReturn;
    }

    private GetContractAbi(): void {
      this.contractAbi = require("../../../build/contracts/TicTacTotalMania.json");
    }

    private async Join(address: any) {
      this.isMining = true;      
      this.activeAccount = this._web3Service.GetActiveAccount();
      this.activeContract = await this._web3Service.GetContractInstance(this.contractAbi, address.contractAddress);
      localStorage.setItem('contractAddress', address.contractAddress);
      let stakeRequired = await this.activeContract.methods.stake().call(address);
      
      this.activeContract = await this.activeContract.methods.join().send({from: this.activeAccount, value: stakeRequired},
        (error, txHash) => {})
          .on('error', (error) => { 
            console.error('error', error);
            // window.location.reload();
          })
          .on('transactionHash', (transactionHash) => { 
            console.log('transactionHash', transactionHash);
            this.txUrl = `https://${this.connectedNetwork}.etherscan.io/tx/${transactionHash}`;
          })
          .on('receipt', function(receipt) {
            console.log('receipt', receipt.contractAddress);
          })
          .on('confirmation', (confirmationNumber, receipt) => { 
            console.log('confirmationNumber', confirmationNumber);
            console.log('receipt', receipt);
          });

      this.gameInProgress = true;
      this.isMining = false;
      localStorage.setItem('gameInProg', JSON.stringify(this.activeContract));
      
    }

    private ShowMarker(event: MouseEvent): void {
      if ((event.target as HTMLElement).tagName == 'P')
        return;
      (event.target as HTMLElement).getElementsByTagName('p')[0].innerText = this.playerMarker;
      (event.target as HTMLElement).getElementsByTagName('p')[0].classList.add(this.playerNum.toString());
    }

    private DestroyMarkers(event: MouseEvent): void {
      (event.target as HTMLElement).getElementsByTagName('p')[0].innerText = '';
    }

    public PlacePiece(): void {
      // this.TicTacTotalMania.
    }

    public GameOver(): void {
      this.gameInProgress = false;
      localStorage.clear();
    } 

    private ShowWaitingForTurnSpinner(): boolean {
      return !this.isMyTurn 
        && this.gameInProgress 
        && this.currActivePlayer != '0x0000000000000000000000000000000000000000'
        && this.playerTwo != '0x0000000000000000000000000000000000000000';
    }

    private ShowWaitingToJoinSpinner(): boolean {
      return this.contractAddress 
      && this.playerTwo != '0x0000000000000000000000000000000000000000'
      && this.currActivePlayer == '0x0000000000000000000000000000000000000000';
    }

}

export interface ContractDeploy {
  txHash: null,
  receipt: null,
  confirmation: null
}