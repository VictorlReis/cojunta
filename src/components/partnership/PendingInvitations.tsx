import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useInvitations } from '@/hooks/useInvitations'
import { Mail, UserCheck, X } from 'lucide-react'
import type { Invitation } from '@/types/database'

interface ReceivedInvitation extends Invitation {
  inviter?: {
    display_name: string
    email: string
  }
}

interface PendingInvitationsProps {
  invitations: ReceivedInvitation[]
}

export function PendingInvitations({ invitations }: PendingInvitationsProps) {
  const { acceptInvitation, declineInvitation } = useInvitations()

  if (invitations.length === 0) return null

  return (
    <div className="space-y-3">
      {invitations.map((inv) => (
        <Card key={inv.id} className="border-primary/50 bg-primary/5">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">
                  Convite de{' '}
                  <span className="font-semibold">
                    {inv.inviter?.display_name ?? inv.inviter?.email ?? 'alguem'}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">{inv.inviter?.email}</p>
              </div>
              <Badge variant="secondary">Pendente</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => declineInvitation.mutate(inv.id)}
                disabled={declineInvitation.isPending}
              >
                <X className="h-3 w-3" />
                Recusar
              </Button>
              <Button
                size="sm"
                className="gap-1"
                onClick={() => acceptInvitation.mutate(inv.id)}
                disabled={acceptInvitation.isPending}
              >
                <UserCheck className="h-3 w-3" />
                Aceitar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
