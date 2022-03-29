import { lsb, msb, toUint16 } from "./utils";

export enum MessageType {
  Undefined = 0,

  Register = 1,
  CreateRoom = 2,
  JoinRoom = 3,

  Registered = 128,
  RoomCreated = 129,
  ListClients = 130,
}

export interface Message {
  type: MessageType;
  data: string;
}

export const encodeMessage = (
  messageType: MessageType,
  data: string
): ArrayBuffer => {
  const totalLength = (3 + data.length) & 0xffff;
  const messageTypeBytes = new Uint8Array(1);
  const totalLengthBytes = new Uint8Array(2);

  messageTypeBytes[0] = messageType.valueOf();
  totalLengthBytes[0] = msb(totalLength);
  totalLengthBytes[1] = lsb(totalLength);

  let utf8Encode = new TextEncoder();
  const dataBytes = utf8Encode.encode(data);

  const message = new Uint8Array([
    ...messageTypeBytes,
    ...totalLengthBytes,
    ...dataBytes,
  ]);

  console.log(message);

  return message.buffer;
};

export const decodeMessage = (buffer: ArrayBuffer): Message => {
  const messageTypeView = new Uint8Array(buffer, 0, 1);

  const totalLengthView = new Uint8Array(buffer, 1, 2);

  const totalLength = toUint16(totalLengthView);

  const dataView = new Uint8Array(buffer, 3, totalLength - 3);

  const messageType = Object.entries(MessageType).find(
    ([, messageTypeValue]) => messageTypeView[0] === messageTypeValue
  );
  if (!messageType) {
    throw new Error(`Unsupported message type '${messageTypeView[0]}'`);
  }
  const messageTypeEnum = MessageType[
    messageType[0] as any
  ] as unknown as MessageType;
  const utf8Decoder = new TextDecoder("utf-8");
  const data = utf8Decoder.decode(dataView);

  return {
    type: messageTypeEnum,
    data,
  };
};
