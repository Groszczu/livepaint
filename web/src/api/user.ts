import { createStore } from "solid-js/store";

interface UserStore {
  username: string | null;
}

export const [userStore, setUserStore] = createStore<UserStore>({
  username: null,
});
