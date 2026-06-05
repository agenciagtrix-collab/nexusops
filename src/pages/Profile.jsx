import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import TopBar from '@/components/layout/TopBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Save, User, Shield, Bell, Palette, Globe, Key, LogOut } from 'lucide-react';

const notificationOptions = [
  { key: 'task_assigned', label: 'Tarefa atribuída a mim' },
  { key: 'task_due', label: 'Tarefa vencendo amanhã' },
  { key: 'comment_mention', label: 'Menção em comentário' },
  { key: 'project_update', label: 'Atualizações de projeto' },
  { key: 'team_invite', label: 'Convite para equipe' },
];

const themeOptions = [
  { key: 'light', label: 'Claro' },
  { key: 'dark', label: 'Escuro' },
  { key: 'system', label: 'Sistema' },
];

const languageOptions = [
  { key: 'pt_BR', label: 'Português (Brasil)' },
  { key: 'en_US', label: 'English (US)' },
  { key: 'es_ES', label: 'Español' },
];

export default function Profile() {
  const { onMenuToggle } = useOutletContext();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);

  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    position: user?.position || '',
  });

  const [notifications, setNotifications] = useState(
    notificationOptions.reduce((acc, opt) => ({ ...acc, [opt.key]: true }), {})
  );

  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'pt_BR',
    timezone: 'America/Sao_Paulo',
  });

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await base44.auth.updateMe({
        full_name: profileForm.full_name,
        phone: profileForm.phone,
        bio: profileForm.bio,
        position: profileForm.position,
      });
      toast.success('Perfil atualizado!');
    } catch (e) {
      toast.error('Erro ao salvar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { key: 'profile', label: 'Perfil', icon: User },
    { key: 'notifications', label: 'Notificações', icon: Bell },
    { key: 'preferences', label: 'Preferências', icon: Palette },
    { key: 'security', label: 'Segurança', icon: Key },
  ];

  return (
    <>
      <TopBar onMenuToggle={onMenuToggle} title="Meu Perfil" />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">

          {/* Profile header */}
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-lg font-heading font-bold">{user?.full_name || 'Usuário'}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    {user?.role === 'admin' ? 'Administrador' : 'Usuário'}
                  </Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" className="hidden sm:flex gap-1.5" onClick={() => base44.auth.logout('/login')}>
                <LogOut className="w-4 h-4" /> Sair
              </Button>
            </div>
          </Card>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${
                    activeTab === tab.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab: Profile */}
          {activeTab === 'profile' && (
            <Card className="p-5 space-y-4">
              <h3 className="font-semibold text-sm">Informações Pessoais</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome completo</Label>
                  <Input
                    value={profileForm.full_name}
                    onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input value={profileForm.email} disabled className="opacity-60" />
                  <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado</p>
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={profileForm.phone}
                    onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+55 11 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cargo / Função</Label>
                  <Input
                    value={profileForm.position}
                    onChange={e => setProfileForm(f => ({ ...f, position: e.target.value }))}
                    placeholder="Ex: Gerente de Projetos"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Bio</Label>
                  <Input
                    value={profileForm.bio}
                    onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))}
                    placeholder="Conte um pouco sobre você..."
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={isSaving} className="gap-1.5">
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Salvando...' : 'Salvar Perfil'}
                </Button>
              </div>
            </Card>
          )}

          {/* Tab: Notifications */}
          {activeTab === 'notifications' && (
            <Card className="p-5 space-y-4">
              <h3 className="font-semibold text-sm">Preferências de Notificação</h3>
              <div className="space-y-3">
                {notificationOptions.map(opt => (
                  <div key={opt.key} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="text-sm">{opt.label}</span>
                    <button
                      onClick={() => setNotifications(n => ({ ...n, [opt.key]: !n[opt.key] }))}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        notifications[opt.key] ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        notifications[opt.key] ? 'translate-x-4' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button onClick={() => toast.success('Preferências salvas!')} className="gap-1.5">
                  <Save className="w-4 h-4" /> Salvar
                </Button>
              </div>
            </Card>
          )}

          {/* Tab: Preferences */}
          {activeTab === 'preferences' && (
            <Card className="p-5 space-y-4">
              <h3 className="font-semibold text-sm">Aparência e Idioma</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tema</Label>
                  <div className="flex gap-2">
                    {themeOptions.map(t => (
                      <button
                        key={t.key}
                        onClick={() => setPreferences(p => ({ ...p, theme: t.key }))}
                        className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                          preferences.theme === t.key
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border hover:bg-muted'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Idioma</Label>
                  <div className="flex flex-wrap gap-2">
                    {languageOptions.map(l => (
                      <button
                        key={l.key}
                        onClick={() => setPreferences(p => ({ ...p, language: l.key }))}
                        className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                          preferences.language === l.key
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border hover:bg-muted'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Globe className="w-4 h-4" /> Fuso Horário</Label>
                  <Input
                    value={preferences.timezone}
                    onChange={e => setPreferences(p => ({ ...p, timezone: e.target.value }))}
                    placeholder="America/Sao_Paulo"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => toast.success('Preferências salvas!')} className="gap-1.5">
                  <Save className="w-4 h-4" /> Salvar
                </Button>
              </div>
            </Card>
          )}

          {/* Tab: Security */}
          {activeTab === 'security' && (
            <Card className="p-5 space-y-4">
              <h3 className="font-semibold text-sm">Segurança da Conta</h3>
              <div className="space-y-4">
                <div className="p-4 bg-muted/40 rounded-xl space-y-2">
                  <h4 className="text-sm font-semibold">Alterar Senha</h4>
                  <p className="text-xs text-muted-foreground">
                    Para alterar sua senha, acesse a página de recuperação de senha.
                    Um link de redefinição será enviado para seu e-mail.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => window.open('/forgot-password', '_blank')}
                  >
                    <Key className="w-4 h-4" /> Redefinir Senha
                  </Button>
                </div>

                <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-xl space-y-2">
                  <h4 className="text-sm font-semibold text-destructive">Zona de Perigo</h4>
                  <p className="text-xs text-muted-foreground">
                    Ao sair, você precisará fazer login novamente para acessar a plataforma.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => base44.auth.logout('/login')}
                  >
                    <LogOut className="w-4 h-4" /> Encerrar Sessão
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}