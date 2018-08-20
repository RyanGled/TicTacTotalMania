import { Component } from '@angular/core';
import { MatDialog, MatDialogConfig } from '../../node_modules/@angular/material';

import { Web3Service } from './services/web3.service';
import { MersenneTwister } from '../../../core/mersenne-twister';

import { MutationDialogComponent } from './dialogs/mutation.modal.component';
import { JoinGameDialogComponent } from './dialogs/join-game.modal.component';
import Web3 from '../../node_modules/web3';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

    public ethBalance: string;
    private activeAccount: string;
    private contractAbi: any;
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
    private playerOneColor: string = 'rgb(51,153,254)';
    private playerOneMarker: string = 'X';
    private playerTwo: string;
    private playerTwoColor: string = 'rgb(223,142,25)';
    private playerTwoMarker: string = 'O';
    private playerNum: number;
    private playerMarker: string;
    private playerColor: string;
    private currActivePlayer: string;
    private isMyTurn: boolean = false;
    private gameBoard: number[] = null;

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
    }

    private async InitOrRetrieveGame() {
      await this.GetContractAbi();
      await this._web3Service.RetrieveEthAccounts();
      this.activeAccount = await this._web3Service.GetActiveAccount();
      const isGameInProgress = localStorage.getItem('gameInProg');
      this.contractAddress = localStorage.getItem('contractAddress');
      if (isGameInProgress) {
        this.activeContract = await this._web3Service.GetContractInstance(
          this.contractAbi, 
          this.contractAddress
        );
        this.SetContractEventWatchers();
        this.GetPlayerDetails();
      }
      this.CreateBoardSize();
    }

    private async SetContractEventWatchers() {
      var web3Inf = await new Web3('wss://rinkeby.infura.io/_ws');

      const playerHasJoinedEvent = this.contractAbi.abi.filter(val => { return val.name == 'PlayerHasJoined'});
      const nextPlayersTurnEvent = this.contractAbi.abi.filter(val => { return val.name == 'NextPlayersTurn'});
      const mutationEvent = this.contractAbi.abi.filter(val => { return val.name == 'Mutation'});
      const winEvent = this.contractAbi.abi.filter(val => { return val.name == 'Win'});
      const drawEvent = this.contractAbi.abi.filter(val => { return val.name == 'Draw'});
      const payoutEvent = this.contractAbi.abi.filter(val => { return val.name == 'Payout'});

      const subscription = await web3Inf.eth.subscribe('logs', 
        {
          address: this.contractAddress,
          fromBlock: 0
        }, 
        (error, result) => {
          if (error)
            console.log(error);

            console.log('SetContractEventWatchers 1');
            
          console.log(result);
        })
        .on("data", (log) => {
          console.log('SetContractEventWatchers 2');
          switch(log.topics[0]) {
            case playerHasJoinedEvent[0].signature:
              this.PlayerHasJoined(log);
              break;
            case nextPlayersTurnEvent[0].signature:
              this.NextPlayerTurn(log);
              break;
          }
        })
        .on("changed", (log) => {
          console.log('SetContractEventWatchers 3');
          console.log('changed', log);
        });
    }
  
    private PlayerHasJoined(log: any): void {
      this.playerTwo = log.data;
      this.gameInProgress = true;
      this.GetCurrentPlayersTurn();
    }
  
    private NextPlayerTurn(log: any): void {
      console.log('log.data', log.data);
      
      this.currActivePlayer = log.data;
      this.GetCurrentPlayersTurn();
      this.CreateBoardSize();
    }

    private async GetCurrentPlayersTurn() {
      this.currActivePlayer = await this.activeContract.methods.currActivePlayer().call();     
      console.log('this.currActivePlayer', this.currActivePlayer);
      console.log('this.activeAccount', this.activeAccount);
      
       
      if (this.currActivePlayer === this.activeAccount) {
        this.isMyTurn = true;
      } else {
        this.isMyTurn = false;
      }
      console.log('this.isMyTurn', this.isMyTurn);
    }
    
    private async CreateBoardSize() {
      let ySize,
          xSize;
      this.gameBoard = await this.activeContract.methods.returnBoard().call();
      if (this.gameInProgress) {
        ySize = this.gameBoard.length,
        xSize = this.gameBoard.length;
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
        this.playerMarker = this.playerOneMarker;
      }
      const playerTwo = await this.activeContract.methods.secondPlayer().call();      
      if (playerTwo === this.activeAccount) {
        this.playerNum = 2;
        this.playerMarker = this.playerTwoMarker;
      }
      if (playerOne !== '0x0000000000000000000000000000000000000000' 
          && playerTwo !== '0x0000000000000000000000000000000000000000')
          this.gameInProgress = true;
      this.playerOne = playerOne;
      this.playerTwo = playerTwo;
      this.playerNum === 1 ? this.playerColor = this.playerOneColor : this.playerColor = this.playerTwoColor;
      this.GetCurrentPlayersTurn();
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
      this.InitOrRetrieveGame();
      this.isMining = false;
      
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
      
      let txRes = await this.activeContract.methods.join().send({from: this.activeAccount, value: stakeRequired},
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

      this.InitOrRetrieveGame();
      this.gameInProgress = true;
      this.isMining = false;
      localStorage.setItem('gameInProg', JSON.stringify(txRes));
    }

    private ShowMarker(event: MouseEvent, xPos: number, yPos: number): void {
      if (this.CheckIfSquareIsOccupied(xPos, yPos))
        return;
      if ((event.target as HTMLElement).tagName == 'P')
        return;
      (event.target as HTMLElement).getElementsByTagName('p')[0].innerText = this.playerMarker;
      (event.target as HTMLElement).getElementsByTagName('p')[0].classList.add(this.playerNum.toString());
    }

    private DestroyMarkers(event: MouseEvent, xPos: number, yPos: number): void {
      if (this.CheckIfSquareIsOccupied(xPos, yPos))
        return;
      (event.target as HTMLElement).getElementsByTagName('p')[0].innerText = '';
    }

    private CheckIfSquareIsOccupied(xPos: number, yPos: number): boolean {
      return this.gameBoard[xPos][yPos] !== '0x0000000000000000000000000000000000000000';
    }

    public async PlacePiece(event: MouseEvent) {
      const xPos = Number((event.target as HTMLElement).dataset.xpos);
      const yPos = Number((event.target as HTMLElement).dataset.ypos);
      if (this.CheckIfSquareIsOccupied(xPos, yPos))
        return;

      this.isMining = true;
      await this.activeContract.methods.placePiece(xPos, yPos).send({from: this.activeAccount},
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
      this.isMining = false;
      this.CreateBoardSize();
      this.GetCurrentPlayersTurn();
    }

    public GameOver(): void {
      this.gameInProgress = false;
      localStorage.clear();
    } 

    private ShowWaitingForTurnSpinner(): boolean {
      return !this.isMyTurn 
        && this.gameInProgress
        && 
        ( 
          this.currActivePlayer != '0x0000000000000000000000000000000000000000'
          && this.currActivePlayer != this.activeAccount
        )
        && this.playerTwo != '0x0000000000000000000000000000000000000000';
    }

    private ShowWaitingToJoinSpinner(): boolean {
      return this.contractAddress
      && !this.gameInProgress
      && this.playerTwo == '0x0000000000000000000000000000000000000000';
    }

}

export interface ContractDeploy {
  txHash: null,
  receipt: null,
  confirmation: null
}