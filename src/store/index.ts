import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './authSlice';
import demoReducer from './demoSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    demo: demoReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Prevents warning overheads on non-serialized date parameters
    }),
});

// Infer global Store Types from the configuration structure itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Generate customized type-safe dispatch/selector hooks for app-wide consumption
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
