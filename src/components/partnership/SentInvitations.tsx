import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useInvitations } from '@/hooks/useInvitations'
import { Send, X } from 'lucide-react'
import type { Invitation } from '@/types/database'

interface SentInvitationsProps {
  invitations: Invitation[]
}

export function SentInvitations({ invitations }: SentInvitationsProps) {
  const { cancelInvitation } = useInvitations()

  if (invitations.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Convites enviados</p>
      {invitations.map((inv) => (
        <div key={inv.id} className="flex items-center justify-between rounded-md border px-3 py-2">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{inv.invitee_email}</span>
            <Badge variant="outline">Pendente</Badge>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-destructive hover:text-destructive"
            onClick={() => cancelInvitation.mutate(inv.id)}
            disabled={cancelInvitation.isPending}
          >
            <X className="h-3 w-3" />
            Cancelar
          </Button>
        </div>
      ))}
    </div>
  )
}
