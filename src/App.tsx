import '@/lib/sentry';
import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorBusProvider } from '@/components/ErrorBus';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import UeberwachteAnwendungenPage from '@/pages/UeberwachteAnwendungenPage';
import SchwellenwertePage from '@/pages/SchwellenwertePage';
import MessungenPage from '@/pages/MessungenPage';
import PublicFormUeberwachteAnwendungen from '@/pages/public/PublicForm_UeberwachteAnwendungen';
import PublicFormSchwellenwerte from '@/pages/public/PublicForm_Schwellenwerte';
import PublicFormMessungen from '@/pages/public/PublicForm_Messungen';
// <public:imports>
// </public:imports>
// <custom:imports>
// </custom:imports>

export default function App() {
  return (
    <ErrorBoundary>
      <ErrorBusProvider>
        <HashRouter>
          <ActionsProvider>
            <Routes>
              <Route path="public/6abcb50f29a4754b70822854" element={<PublicFormUeberwachteAnwendungen />} />
              <Route path="public/6abcb5139d56ccbaa43e98cb" element={<PublicFormSchwellenwerte />} />
              <Route path="public/6abcb5148be783f494595865" element={<PublicFormMessungen />} />
              {/* <public:routes> */}
              {/* </public:routes> */}
              <Route element={<Layout />}>
                <Route index element={<DashboardOverview />} />
                <Route path="ueberwachte-anwendungen" element={<UeberwachteAnwendungenPage />} />
                <Route path="schwellenwerte" element={<SchwellenwertePage />} />
                <Route path="messungen" element={<MessungenPage />} />
                <Route path="admin" element={<AdminPage />} />
                {/* <custom:routes> */}
                {/* </custom:routes> */}
              </Route>
            </Routes>
          </ActionsProvider>
        </HashRouter>
      </ErrorBusProvider>
    </ErrorBoundary>
  );
}
