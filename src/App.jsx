import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Projects from '@/pages/Projects';
import ProjectForm from '@/pages/ProjectForm';
import ProjectDetail from '@/pages/ProjectDetail';
import MyTasks from '@/pages/MyTasks';
import Teams from '@/pages/Teams';
import Clients from '@/pages/Clients';
import Analytics from '@/pages/Analytics';
import SettingsPage from '@/pages/SettingsPage';
import Documents from '@/pages/Documents';
import CustomFields from '@/pages/CustomFields';
import ClientDetail from '@/pages/ClientDetail';
import Processes from '@/pages/Processes';
import Profile from '@/pages/Profile';
import SuperAdminPanel from '@/pages/SuperAdminPanel';
import Automations from '@/pages/Automations';
import AutomationBuilder from '@/pages/AutomationBuilder';
import ProjectTemplates from '@/pages/ProjectTemplates';
import Contracts from '@/pages/Contracts';
import ClientPortal from '@/pages/ClientPortal';
import AIAgents from '@/pages/AIAgents';
import AIAgentForm from '@/pages/AIAgentForm';
import AIAgentChat from '@/pages/AIAgentChat';
import Forms from '@/pages/Forms';
import FormBuilder from '@/pages/FormBuilder';
import FormResponses from '@/pages/FormResponses';
import FormAnalytics from '@/pages/FormAnalytics';
import FormTemplates from '@/pages/FormTemplates';
import FormAICreator from '@/pages/FormAICreator';
import FormShare from '@/pages/FormShare';
import FlowBuilder from '@/pages/FlowBuilder';
import Flows from '@/pages/Flows';
import FlowTemplates from '@/pages/FlowTemplates';
import FlowPublic from '@/pages/FlowPublic';
import FlowResponses from '@/pages/FlowResponses';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">P</span>
          </div>
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/new" element={<ProjectForm />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/projects/:id/edit" element={<ProjectForm />} />
          <Route path="/my-tasks" element={<MyTasks />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/custom-fields" element={<CustomFields />} />
          <Route path="/processes" element={<Processes />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<SuperAdminPanel />} />
          <Route path="/automations" element={<Automations />} />
          <Route path="/automation-builder" element={<AutomationBuilder />} />
          <Route path="/templates" element={<ProjectTemplates />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/ai-agents" element={<AIAgents />} />
          <Route path="/ai-agents/new" element={<AIAgentForm />} />
          <Route path="/ai-agents/:id/edit" element={<AIAgentForm />} />
          <Route path="/ai-agents/chat" element={<AIAgentChat />} />
          <Route path="/ai-agents/chat/:id" element={<AIAgentChat />} />
          <Route path="/forms" element={<Forms />} />
          <Route path="/forms/new" element={<FormBuilder />} />
          <Route path="/forms/:id/edit" element={<FormBuilder />} />
          <Route path="/forms/:id/responses" element={<FormResponses />} />
          <Route path="/forms/:id/analytics" element={<FormAnalytics />} />
          <Route path="/form-templates" element={<FormTemplates />} />
          <Route path="/form-ai-creator" element={<FormAICreator />} />
          <Route path="/flows" element={<Flows />} />
          <Route path="/flows/templates" element={<FlowTemplates />} />
          <Route path="/flows/new" element={<FlowBuilder />} />
          <Route path="/flows/:id/edit" element={<FlowBuilder />} />
          <Route path="/flows/:flowId/responses" element={<FlowResponses />} />
        </Route>
      </Route>

      {/* Public route — no auth required */}
      <Route path="/share/:token" element={<ClientPortal />} />
      <Route path="/form/:id" element={<FormShare />} />
      <Route path="/flow/:id" element={<FlowPublic />} />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App