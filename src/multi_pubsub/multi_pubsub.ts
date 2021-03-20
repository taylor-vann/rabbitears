import type { BaseChannels, Receiver, Receipt } from "../type_flyweight/rabbitears.ts";

type SubscriptionMap<S extends BaseChannels> = Record<
  number,
  Receiver<S> | undefined
>;

type MultiPubSubMap1<S extends BaseChannels> = Partial<
  Record<keyof S, PubSub<S>>
>;


type RecycledReceipts = number[];

class PubSub<S extends BaseChannels> {
  receipt: number;
  recycledReceipts: RecycledReceipts;
  subscriptions: SubscriptionMap<S>;

  constructor() {
    this.receipt = -1;
    this.recycledReceipts = [];
    this.subscriptions = {};
  }

  broadcast(state: S) {
    for (const subscriptionID in this.subscriptions) {
      const receiver = this.subscriptions[subscriptionID];
      receiver?.bang(state[receiver.channel]);
    }
  }

  subscribe(receiver: Receiver<S>): number {
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

  unsubscribe(receipt: number) {
    if (this.subscriptions[receipt] !== undefined) {
      this.subscriptions[receipt] = undefined;
      this.recycledReceipts.push(receipt);
    }
  }
}

class MultiPubSub<S extends BaseChannels> {
  subscriptions: MultiPubSubMap1<S>;

  constructor() {
    this.subscriptions = {};
  }

  broadcast<T extends keyof S>(channel: T, state: S): void {
    const pubsub = this.subscriptions[channel];
    pubsub?.broadcast(state);
  }

  subscribe(receiver: Receiver<S>): Receipt<S> | undefined {
    const { channel } = receiver;
    if (this.subscriptions[channel] === undefined) {
      this.subscriptions[channel] = new PubSub();
    }

    const stub = this.subscriptions[channel]?.subscribe(receiver);
    if (stub === undefined) {
      return;
    }

    return {
      channel,
      stub,
    };
  }

  unsubscribe(receipt: Receipt<S>) {
    const {channel, stub} = receipt;
    const channelSubscriptions = this.subscriptions[channel];
    if (channelSubscriptions !== undefined) {
      channelSubscriptions.unsubscribe(stub);
    }
  }
}

export { MultiPubSub, PubSub };
