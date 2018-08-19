class EventService {

    private networkEventListeners: Function[];
    private errorEventListeners: Function[];

    constructor() {
        this.errorEventListeners = new Array<Function>();
        this.networkEventListeners = new Array<Function>();
    }

    public EmitErrorEvent(_event: any) {
        this.errorEventListeners.map(listener => {
            listener(_event);
        });
    }

    public EmitNetworkEvent(_event: any) {
        this.networkEventListeners.map(listener => {
            listener(_event);
        });
    }

    public RegisterErrorEventListener(_listener: Function) {
        this.errorEventListeners.push(_listener);
    }

    public RegisterNetworkEventListener(_listener: Function) {
        //register the listener
        this.networkEventListeners.push(_listener);
    }

}


export default EventService;
