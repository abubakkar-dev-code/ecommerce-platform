import { createSlice } from "@reduxjs/toolkit";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface authState {
  users: User | null;
  isAuthenticated: boolean;
  token: null | string;
}

const initialState: authState = {
  users: null,
  isAuthenticated: false,
  token: null,
};

const authSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setUsers: (state, action) => {
      state.users = action.payload;
    },
  },
});

export const { setUsers } = authSlice.actions;
export default authSlice.reducer;
