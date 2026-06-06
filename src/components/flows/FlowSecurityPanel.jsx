import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

export default function FlowSecurityPanel({ publish, onUpdate }) {
  const [isPublic, setIsPublic] = useState(publish?.is_public !== false);
  const [isPasswordProtected, setIsPasswordProtected] = useState(publish?.is_password_protected || false);
  const [password, setPassword] = useState(publish?.password || '');
  const [allowedEmails, setAllowedEmails] = useState((publish?.allowed_emails || []).join(', '));
  const [maxResponses, setMaxResponses] = useState(publish?.max_responses || '');
  const [expiresAt, setExpiresAt] = useState(publish?.expires_at || '');

  const handleSave = () => {
    onUpdate({
      is_public: isPublic,
      is_password_protected: isPasswordProtected,
      password: isPasswordProtected ? password : null,
      allowed_emails: allowedEmails ? allowedEmails.split(',').map(e => e.trim()) : [],
      max_responses: maxResponses ? parseInt(maxResponses) : null,
      expires_at: expiresAt || null,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-4 h-4" />
          Segurança e Privacidade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Public/Private */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded"
            />
            Fluxo Público
          </Label>
          <p className="text-xs text-muted-foreground">Qualquer pessoa pode acessar com o link</p>
        </div>

        {/* Password Protection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPasswordProtected}
              onChange={(e) => setIsPasswordProtected(e.target.checked)}
              className="rounded"
            />
            Proteger com Senha
          </Label>
          {isPasswordProtected && (
            <Input
              type="password"
              placeholder="Digite a senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
        </div>

        {/* Allowed Emails */}
        <div className="space-y-2">
          <Label>E-mails Permitidos (opcional)</Label>
          <Input
            placeholder="email1@example.com, email2@example.com"
            value={allowedEmails}
            onChange={(e) => setAllowedEmails(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Separe por vírgula</p>
        </div>

        {/* Max Responses */}
        <div className="space-y-2">
          <Label>Máximo de Respostas (opcional)</Label>
          <Input
            type="number"
            placeholder="100"
            value={maxResponses}
            onChange={(e) => setMaxResponses(e.target.value)}
          />
        </div>

        {/* Expiration */}
        <div className="space-y-2">
          <Label>Data de Expiração (opcional)</Label>
          <Input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>

        <Button onClick={handleSave} className="w-full">
          Salvar Configurações de Segurança
        </Button>
      </CardContent>
    </Card>
  );
}