//business app
import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  user: null,
  isSuperAdmin: false,
  loading: true,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload
      state.loading = false
    },
    setIsSuperAdmin: (state, action) => {
      state.isSuperAdmin = action.payload
    },
    logout: (state) => {
      state.user = null
      state.isSuperAdmin = false
      state.loading = false
    },
  },
})

export const { setUser, setIsSuperAdmin, logout } = authSlice.actions
export default authSlice.reducer
