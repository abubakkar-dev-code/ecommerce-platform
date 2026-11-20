import { createSlice } from "@reduxjs/toolkit";

export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  role: string;
}

interface Credentials {
  user: User;
}

interface authState {
  users: User | null;
  isAuthenticated: boolean;
  status: "checking" | "ready" | "error";
}

const initialState: authState = {
  users: null,
  isAuthenticated: false,
  status: "checking",
};

const authSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setCredentials: (state, action: { payload: Credentials }) => {
      state.users = action.payload.user;
      state.isAuthenticated = true;
      state.status = "ready";
    },
    clearCredentials: (state) => {
      state.users = null;
      state.isAuthenticated = false;
      state.status = "ready";
    },
    sessionError: (state) => { state.status = "error"; },
  },
});

export const { setCredentials, clearCredentials, sessionError } = authSlice.actions;
export default authSlice.reducer;
