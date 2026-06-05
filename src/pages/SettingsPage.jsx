import React from 'react';
import { useOutletContext } from 'react-router-dom';
import TopBar from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, User, Shield, Bell } from 'lucide-react';

export default function SettingsPage() {
  const { onMenuToggle } = useOutletContext();

  return (
    <>
      <TopBar onMenuToggle={onMenuToggle} title="Configurações" />
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-semibold">Perfil</h3>
                <p className="text-sm text-muted-foreground">Gerencie suas informações pessoais</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-semibold">Permissões</h3>
                <p className="text-sm text-muted-foreground">Configure níveis de acesso</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-semibold">Notificações</h3>
                <p className="text-sm text-muted-foreground">Configure suas preferências de notificação</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}