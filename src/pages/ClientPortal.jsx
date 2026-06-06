import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PortalHeader from '@/components/portal/PortalHeader';
import PortalDashboard from '@/components/portal/PortalDashboard';
import PortalNextSteps from '@/components/portal/PortalNextSteps';
import PortalTasks from '@/components/portal/PortalTasks';
import PortalTimeline from '@/components/portal/PortalTimeline';
import PortalUpdates from '@/components/portal/PortalUpdates';
import PortalFiles from '@/components/portal/PortalFiles';
import { Loader2, ShieldX, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'overview',   label: 'Visão Geral', visKey: null },
  { key: 'tasks',      label: 'Tarefas',     visKey: 'show_tasks' },
  { key: 'timeline',   label: 'Timeline',    visKey: 'show_timeline' },
  { key: 'updates',    label: 'Atualizações', visKey: null },
  { key: 'files',      label: 'Arquivos',    visKey: 'show_files' },
];

export default function ClientPortal() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await base44.functions.invoke('validateShareToken', { token });
        setData(res.data);
      } catch (err) {
        setError(err.message || 'Link inválido ou expirado');
      } finally {
        setLoading(false);
      }
    };
    if (token) load();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Globe className="w-7 h-7 text-primary" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando portal do cliente...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
            <ShieldX className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold">Link inválido ou expirado</h2>
          <p className="text-muted-foreground text-sm">
            Este link não existe, foi revogado ou expirou. Entre em contato com a equipe responsável.
          </p>
        </div>
      </div>
    );
  }

  const { project, tasks, client, users, documents, updates, share } = data;
  const settings = share.visibility_settings;

  const visibleTabs = TABS.filter(t => !t.visKey || settings[t.visKey]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Portal Header */}
      <PortalHeader project={project} client={client} tasks={tasks} settings={settings} />

      {/* Sticky tab navigation */}
      <div className="bg-white dark:bg-gray-900 border-b border-border sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex overflow-x-auto">
            {visibleTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                  activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                {tab.label}
                {tab.key === 'updates' && updates.length > 0 && (
                  <span className="ml-1.5 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                    {updates.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {settings.show_dashboard && (
              <PortalDashboard project={project} tasks={tasks} />
            )}
            {settings.show_next_steps && (
              <PortalNextSteps tasks={tasks} settings={settings} project={project} />
            )}
            {!settings.show_dashboard && !settings.show_next_steps && (
              <p className="text-center text-muted-foreground text-sm py-10">
                Nenhuma informação visível nesta seção.
              </p>
            )}
          </div>
        )}

        {/* Tasks tab */}
        {activeTab === 'tasks' && settings.show_tasks && (
          <PortalTasks tasks={tasks} users={users} project={project} settings={settings} />
        )}

        {/* Timeline tab */}
        {activeTab === 'timeline' && settings.show_timeline && (
          <PortalTimeline tasks={tasks} settings={settings} />
        )}

        {/* Updates tab */}
        {activeTab === 'updates' && (
          <PortalUpdates updates={updates} />
        )}

        {/* Files tab */}
        {activeTab === 'files' && settings.show_files && (
          <PortalFiles documents={documents} />
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-white dark:bg-gray-900 py-5 mt-10">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Portal do Cliente · Acesso somente leitura
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            Conexão segura
          </div>
        </div>
      </footer>
    </div>
  );
}