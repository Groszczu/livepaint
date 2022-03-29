import {
  Button,
  createDisclosure,
  Heading,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  VStack,
  Text,
  ModalFooter,
} from "@hope-ui/solid";
import { Component } from "solid-js";
import { createWebSocket, webSocketStore } from "../api";
import { decodeMessage, encodeMessage, MessageType } from "../api/message";

const HomePage: Component = () => {
  let usernameInput: HTMLInputElement;
  return (
    <VStack
      spacing="$10"
      maxW={900}
      alignItems="center"
      justifyContent="center"
      minH="100vh"
      marginStart="auto"
      marginEnd="auto"
    >
      <Heading size="5xl">livepaint</Heading>
      <Input ref={usernameInput!} placeholder="Your username..." />
      <HStack spacing="$24">
        <Button
          size="lg"
          onClick={() => {
            const trimmedUsername = usernameInput.value.trim();
            if (!trimmedUsername) {
              return;
            }
            createWebSocket();
            webSocketStore.ws?.addEventListener("open", () => {
              webSocketStore.ws?.send(
                encodeMessage(MessageType.Register, trimmedUsername)
              );
            });
          }}
        >
          Create room
        </Button>
        <Button size="lg" colorScheme="neutral">
          Join existing room
        </Button>
      </HStack>
    </VStack>
  );
};

export default HomePage;
