import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { NavBar } from './components/NavBar';
import { HomePage } from './pages/HomePage';
import { AnalysisPage } from './pages/AnalysisPage';
import { SummaryPage } from './pages/SummaryPage';
import { GroupsPage } from './pages/GroupsPage';
import { ResultsPage } from './pages/ResultsPage';
import { AuthPage } from './pages/AuthPage';
import { Footer } from './components/Footer';

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AnalysisProvider } from './context/AnalysisContext';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <AnalysisProvider>
        <BrowserRouter>
          <div className="App">
            <NavBar />
            <main style={{ paddingTop: 'var(--nav-h)' }}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />} />
                
                <Route path="/analysis" element={
                  <ProtectedRoute>
                    <AnalysisPage />
                  </ProtectedRoute>
                } />
                <Route path="/summary" element={
                    <ProtectedRoute>
                        <SummaryPage />
                    </ProtectedRoute>
                } />
                <Route path="/results" element={
                  <ProtectedRoute>
                    <ResultsPage />
                  </ProtectedRoute>
                } />
                <Route path="/groups" element={
                  <ProtectedRoute>
                    <GroupsPage />
                  </ProtectedRoute>
                } />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </AnalysisProvider>
    </AuthProvider>
  );
}