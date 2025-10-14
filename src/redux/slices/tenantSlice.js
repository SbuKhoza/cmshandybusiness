import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  currentTenantId: null,
  tenantData: null,
  tenants: [],
  loading: false,
}

const tenantSlice = createSlice({
  name: "tenant",
  initialState,
  reducers: {
    setCurrentTenant: (state, action) => {
      state.currentTenantId = action.payload
    },
    setTenantData: (state, action) => {
      state.tenantData = action.payload
    },
    setTenants: (state, action) => {
      state.tenants = action.payload
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    clearTenant: (state) => {
      state.currentTenantId = null
      state.tenantData = null
    },
  },
})

export const { setCurrentTenant, setTenantData, setTenants, setLoading, clearTenant } = tenantSlice.actions
export default tenantSlice.reducer
