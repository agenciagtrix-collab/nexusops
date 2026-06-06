import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PortalHeader from '@/components/portal/PortalHeader';
import PortalProgress from '@/components/portal/PortalProgress';
import PortalDashboard from '@/components/portal/PortalDashboard';
import PortalNextSteps from '@/components/portal/PortalNextSteps';
import PortalTasks from '@/components/portal/PortalTasks';
import PortalTimeline from '@/components/portal/PortalTimeline';
import PortalUpdates from '@/components/portal/PortalUpdates';
import PortalFiles from '@/components/portal/PortalFiles';
import { Loader2, ShieldX, Globe, LayoutDashboard, List, GitBranch, Megaphone, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'overview',  label: 'Visão Geral',  icon: LayoutDashboard, visKey: null },
  { key: 'tasks',     label: 'Tarefas',       icon: List,             visKey: 'show_tasks' },
  { key: 'timeline',  label: 'Timeline',      icon: GitBranch,        visKey: 'show_timeline' },
  { key: 'updates',   label: 'Atualizações',  icon: Megaphone,        visKey: null },
  { key: 'files',     label: 'Arquivos',      icon: FolderOpen,       visKey: 'show_files' },
];

function PortalLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-gray-900 border-2 border-primary flex items-center justify-center">
            <Loader2 className="w-3 h-3 animate-spin text-primary" />
          </div>
        </div>
        <div>
          <p className="font-semibold text-foreground">Portal do Cliente</p>
          <p className="text-sm text-muted-foreground mt-1">Carregando projeto...</p>
        </div>
      </div>
    </div>
  );
}

function PortalError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4">
      <div className="text-center space-y-5 max-w-sm">
        <div className="w-20 h-20 rounded-3xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center mx-auto border border-red-200 dark:border-red-800">
          <ShieldX className="w-10 h-10 text-red-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Link inválido ou expirado</h2>
          <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
            Este link não existe, foi revogado ou expirou.<br />Entre em contato com a equipe responsável pelo projeto.
          </p>
        </div>
      </div>
    </div>
  );
}

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

  if (loading) return <PortalLoading />;
  if (error || !data) return <PortalError />;

  const { project, tasks, client, users, documents, updates, share } = data;
  const settings = share.visibility_settings;
  const visibleTabs = TABS.filter(t => !t.visKey || settings[t.visKey]);
  const accentColor = project.color || '#6366f1';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">

      {/* ── Top brand bar ─────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 border-b border-border px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: accentColor }}>
            <Globe className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground">Portal do Cliente</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Acesso somente leitura
        </div>
      </div>

      {/* ── Project hero header ───────────────────────────────────────── */}
      <PortalHeader project={project} client={client} tasks={tasks} settings={settings} />

      {/* ── Sticky tab navigation ─────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 border-b border-border sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-none">
            {visibleTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all",
                    isActive
                      ? "text-foreground border-b-2"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                  style={isActive ? { borderBottomColor: accentColor, color: accentColor } : {}}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.key === 'updates' && updates.length > 0 && (
                    <span className="ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium"
                      style={{ backgroundColor: accentColor }}>
                      {updates.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Page content ──────────────────────────────────────────────── */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {settings.show_progress && tasks.length > 0 && (
              <PortalProgress tasks={tasks} project={project} />
            )}
            {settings.show_dashboard && (
              <PortalDashboard project={project} tasks={tasks} />
            )}
            {settings.show_next_steps && (
              <PortalNextSteps tasks={tasks} settings={settings} project={project} />
            )}
            {!settings.show_progress && !settings.show_dashboard && !settings.show_next_steps && (
              <div className="text-center py-20 text-muted-foreground text-sm">
                Nenhuma informação configurada para esta visualização.
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && settings.show_tasks && (
          <PortalTasks tasks={tasks} users={users} project={project} settings={settings} />
        )}

        {activeTab === 'timeline' && settings.show_timeline && (
          <PortalTimeline tasks={tasks} settings={settings} />
        )}

        {activeTab === 'updates' && (
          <PortalUpdates updates={updates} />
        )}

        {activeTab === 'files' && settings.show_files && (
          <PortalFiles documents={documents} />
        )}
      </div>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-white dark:bg-gray-900 py-5 mt-auto">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Gerado via Portal do Cliente · Apenas visualização</span>
          <span>© {new Date().getFullYear()} — Todos os direitos reservados</span>
        </div>
      </footer>
    </div>
  );
}