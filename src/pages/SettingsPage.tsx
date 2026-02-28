import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { usePartnership } from '@/hooks/usePartnership'
import { useInvitations } from '@/hooks/useInvitations'
import { useProfile } from '@/hooks/useProfile'
import { InvitePartnerDialog } from '@/components/partnership/InvitePartnerDialog'
import { SentInvitations } from '@/components/partnership/SentInvitations'
import { PendingInvitations } from '@/components/partnership/PendingInvitations'
import { PartnerCard } from '@/components/partnership/PartnerCard'
import type { Invitation } from '@/types/database'

interface ReceivedInvitation extends Invitation {
  inviter?: {
    display_name: string
    email: string
  }
}

export function SettingsPage() {
  const { profile, signOut } = useAuth()
  const { partnership, partner, isLinked } = usePartnership()
  const { received, sent } = useInvitations()
  const { updateProfile } = useProfile()
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Configuracoes</h1>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Gerencie suas informacoes pessoais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Nome de exibicao</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile?.email ?? ''} disabled />
            <p className="text-xs text-muted-foreground">O email nao pode ser alterado aqui.</p>
          </div>
          <Button
            onClick={() => updateProfile.mutate({ display_name: displayName })}
            disabled={updateProfile.isPending || displayName === profile?.display_name || !displayName.trim()}
          >
            {updateProfile.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Partnership Section */}
      <Card>
        <CardHeader>
          <CardTitle>Parceiro(a)</CardTitle>
          <CardDescription>
            {isLinked
              ? 'Voce esta conectado(a) com seu parceiro(a).'
              : 'Convide seu parceiro(a) para compartilhar despesas.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLinked && partner && partnership ? (
            <PartnerCard partner={partner} partnership={partnership} />
          ) : (
            <div className="space-y-4">
              <InvitePartnerDialog />
              {sent.length > 0 && <SentInvitations invitations={sent} />}
              {received.length > 0 && (
                <PendingInvitations invitations={received as ReceivedInvitation[]} />
              )}
              {sent.length === 0 && received.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhum convite pendente. Convide seu parceiro(a) para comecar a compartilhar despesas.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Account Section */}
      <Card>
        <CardHeader>
          <CardTitle>Conta</CardTitle>
          <CardDescription>Acoes da sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={signOut} className="gap-2">
            Sair da conta
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
