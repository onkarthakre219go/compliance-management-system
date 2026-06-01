import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

import { store } from './store';
import { theme } from './theme/theme';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';

import ClientsManagement from './pages/ClientsManagement';
import TasksManagement from './pages/TasksManagement';
import InvoicesManagement from './pages/InvoicesManagement';
import ComplianceCalendar from './pages/ComplianceCalendar';
import Reports from './pages/Reports';
import NotFound from './pages/NotFound';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/clients" replace />} />
              <Route path="clients" element={<ClientsManagement />} />
              <Route path="tasks" element={<TasksManagement />} />
              <Route path="invoices" element={<InvoicesManagement />} />
              <Route path="compliance-calendar" element={<ComplianceCalendar />} />
              <Route path="reports" element={<Reports />} />
              <Route path="not-found" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/not-found" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}
