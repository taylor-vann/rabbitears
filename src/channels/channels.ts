import type {
  BaseChannels,
  ChannelInterface,
  Message,
  Receiver,
  ChannelsBase,
  Reduction,
  Receipt,
} from "../type_flyweight/rabbitears.ts";
import { MultiPubSub } from "../multi_pubsub/multi_pubsub.ts";

class Channels<S extends BaseChannels> implements ChannelsBase<S> {
  pubsub: MultiPubSub<S>;
  reduction: Reduction<S>;

  constructor(reduction: Reduction<S>) {
    this.pubsub = new MultiPubSub<S>();
    this.reduction = reduction;
  }

  private update<P>(message: Message<S, P>) {
    const updatedChannel = this.reduction.reduce(message);
    if (updatedChannel !== undefined) {
      this.pubsub.broadcast(message.channel, this.reduction.getState());
    }
  }

  getInterface(): ChannelInterface<S> {
    return {
      broadcast: <P>(message: Message<S, P>) => {
        this.update(message);
      },
      getChannel: <T extends keyof S>(channel: T) => {
        return this.reduction.getChannel(channel);
      },
      getState: () => this.reduction.getState(),
      subscribe: (receiver: Receiver<S>) => {
        return this.pubsub.subscribe(receiver);
      },
      unsubscribe: (receipt: Receipt<S>) => {
        this.pubsub.unsubscribe(receipt);
      },
    };
  }
}

export { Channels };
