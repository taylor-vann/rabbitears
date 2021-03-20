class PubSub {
    constructor(){
        this.receipt = -1;
        this.recycledReceipts = [];
        this.subscriptions = {
        };
    }
    broadcast(state) {
        for(const subscriptionID in this.subscriptions){
            const receiver = this.subscriptions[subscriptionID];
            receiver?.bang(state[receiver.channel]);
        }
    }
    subscribe(receiver) {
        let receipt = this.recycledReceipts.pop();
        if (receipt === undefined) {
            this.receipt += 1;
            receipt = this.receipt;
        }
        if (this.subscriptions[receipt] !== undefined) {
            this.subscriptions[receipt] = receiver;
        }
        return receipt;
    }
    unsubscribe(receipt) {
        if (this.subscriptions[receipt] !== undefined) {
            this.subscriptions[receipt] = undefined;
            this.recycledReceipts.push(receipt);
        }
    }
}
class MultiPubSub {
    constructor(){
        this.subscriptions = {
        };
    }
    broadcast(channel, state) {
        const pubsub = this.subscriptions[channel];
        pubsub?.broadcast(state);
    }
    subscribe(receiver) {
        const { channel  } = receiver;
        if (this.subscriptions[channel] === undefined) {
            this.subscriptions[channel] = new PubSub();
        }
        const stub = this.subscriptions[channel]?.subscribe(receiver);
        if (stub === undefined) {
            return;
        }
        return {
            channel,
            stub
        };
    }
    unsubscribe(receipt) {
        const { channel , stub  } = receipt;
        const channelSubscriptions = this.subscriptions[channel];
        if (channelSubscriptions !== undefined) {
            channelSubscriptions.unsubscribe(stub);
        }
    }
}
class Channels {
    constructor(reduction){
        this.pubsub = new MultiPubSub();
        this.reduction = reduction;
    }
    update(message) {
        const updatedChannel = this.reduction.reduce(message);
        if (updatedChannel !== undefined) {
            this.pubsub.broadcast(message.channel, this.reduction.getState());
        }
    }
    getInterface() {
        return {
            broadcast: (message)=>{
                this.update(message);
            },
            getChannel: (channel)=>{
                return this.reduction.getChannel(channel);
            },
            getState: ()=>this.reduction.getState()
            ,
            subscribe: (receiver)=>{
                return this.pubsub.subscribe(receiver);
            },
            unsubscribe: (receipt)=>{
                this.pubsub.unsubscribe(receipt);
            }
        };
    }
}
export { Channels as RabbitEars };
