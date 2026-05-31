import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ArchitecturalMetric {
  id: string;
  name: string;
  value: string;
  status: 'optimal' | 'warning' | 'inactive';
}

interface DemoState {
  counter: number;
  selectedMetricId: string | null;
  metrics: ArchitecturalMetric[];
  telemetryLogs: { id: string; timestamp: string; type: string; payload: string }[];
}

const initialState: DemoState = {
  counter: 0,
  selectedMetricId: 'met_1',
  metrics: [
    { id: 'met_1', name: 'Axios API Connection', value: '200 OK (Simulated & Live)', status: 'optimal' },
    { id: 'met_2', name: 'Redux Dispatch Delay', value: '0.12 ms', status: 'optimal' },
    { id: 'met_3', name: 'MUI Theme Provider State', value: 'Active Dark-Slate Mode', status: 'optimal' },
    { id: 'met_4', name: 'React Router Path Cache', value: '/dashboard (Indexed)', status: 'optimal' },
  ],
  telemetryLogs: [
    { id: 'log_0', timestamp: new Date().toLocaleTimeString(), type: 'STORE_INIT', payload: 'Redux Toolkit Store has initialized with 4 primary sub-structures.' },
  ],
};

const demoSlice = createSlice({
  name: 'demo',
  initialState,
  reducers: {
    incrementCounter: (state) => {
      state.counter += 1;
      state.telemetryLogs.unshift({
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'INCREMENT_COUNTER',
        payload: `Counter increased to ${state.counter}`,
      });
    },
    decrementCounter: (state) => {
      state.counter -= 1;
      state.telemetryLogs.unshift({
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'DECREMENT_COUNTER',
        payload: `Counter decreased to ${state.counter}`,
      });
    },
    selectMetric: (state, action: PayloadAction<string>) => {
      state.selectedMetricId = action.payload;
      const original = state.metrics.find(m => m.id === action.payload);
      state.telemetryLogs.unshift({
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'METRIC_SELECTION_CHANGED',
        payload: `Selected: ${original ? original.name : action.payload}`,
      });
    },
    addTelemetryLog: (state, action: PayloadAction<{ type: string; payload: string }>) => {
      state.telemetryLogs.unshift({
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: action.payload.type,
        payload: action.payload.payload,
      });
      // Cap log length
      if (state.telemetryLogs.length > 50) {
        state.telemetryLogs.pop();
      }
    },
    clearTelemetryLogs: (state) => {
      state.telemetryLogs = [];
    }
  },
});

export const {
  incrementCounter,
  decrementCounter,
  selectMetric,
  addTelemetryLog,
  clearTelemetryLogs,
} = demoSlice.actions;

export default demoSlice.reducer;
