import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { User, LinkIcon, Unlink } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Profile, Partnership } from '@/types/database'

interface PartnerCardProps {
  partner: Profile
  partnership: Partnership
}

export function PartnerCard({ partner, partnership }: PartnerCardProps) {
  const [dissolveOpen, setDissolveOpen] = useState(false)
  const queryClient = useQueryClient()

  const dissolvePartnership = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('partnerships')
        .update({ status: 'dissolved' })
        .eq('id', partnership.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnership'] })
      toast.success('Vinculo desfeito.')
      setDissolveOpen(false)
    },
    onError: () => {
      toast.error('Erro ao desfazer vinculo.')
    },
  })

  return (
    <>
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{partner.display_name}</p>
              <p className="text-sm text-muted-foreground">{partner.email}</p>
            </div>
            <Badge className="gap-1">
              <LinkIcon className="h-3 w-3" />
              Vinculado(a)
            </Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1 text-destructive hover:text-destructive"
            onClick={() => setDissolveOpen(true)}
          >
            <Unlink className="h-3 w-3" />
            Desfazer Vinculo
          </Button>
        </CardContent>
      </Card>

      <Dialog open={dissolveOpen} onOpenChange={setDissolveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desfazer Vinculo</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja desfazer o vinculo com {partner.display_name}? Voce nao vera mais as
              despesas compartilhadas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDissolveOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => dissolvePartnership.mutate()}
              disabled={dissolvePartnership.isPending}
            >
              {dissolvePartnership.isPending ? 'Desfazendo...' : 'Desfazer Vinculo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
