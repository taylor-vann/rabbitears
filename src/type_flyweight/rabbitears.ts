// brian taylor vann
// rabbitears types

type BaseChannels = Record<string, unknown>;

interface Receipt<S extends BaseChannels> {
  channel: keyof S;
  stub: number;
}

interface Message<S extends BaseChannels, P> {
  channel: keyof S;
  kind: string;
  params: P;
}

interface Receiver<S extends BaseChannels> {
  channel: keyof S;
  bang: <T extends this["channel"]>(channelBroadcast: S[T]) => void;
}

interface Reduction<S extends BaseChannels> {
  state: S;
  getState: () => S;
  getChannel: <T extends keyof S>(channel: T) => S[T];
  reduce: <P>(message: Message<S, P>) => keyof S | undefined;
}

interface ChannelInterface<S extends BaseChannels> {
  broadcast: <P>(message: Message<S, P>) => void;
  getChannel: <T extends keyof S>(channel: T) => S[T];
  getState: () => S;
  subscribe: (receiver: Receiver<S>) => Receipt<S> | undefined;
  unsubscribe: (receipt: Receipt<S>) => void;
}

interface ChannelsBase<S extends BaseChannels> {
  reduction: Reduction<S>;
  getInterface: () => ChannelInterface<S>;
}

export type {
  BaseChannels,
  ChannelInterface,
  Message,
  Receiver,
  ChannelsBase,
  Receipt,
  Reduction,
};
