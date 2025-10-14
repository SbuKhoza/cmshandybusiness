import { configureStore } from "@reduxjs/toolkit"
import authReducer from "../slices/authSlice"
import tenantReducer from "../slices/tenantSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tenant: tenantReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore Firebase user object serialization warnings
        ignoredActions: ["auth/setUser"],
        ignoredPaths: ["auth.user"],
      },
    }),
})
