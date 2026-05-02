'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { deletarPaciente } from '@/app/(app)/pacientes/actions'

interface ExcluirPacienteButtonProps {
  pacienteId: string
  nomePaciente: string
}

export function ExcluirPacienteButton({ pacienteId, nomePaciente }: ExcluirPacienteButtonProps) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  async function handleExcluir() {
    setLoading(true)
    try {
      const result = await deletarPaciente(pacienteId)
      if (result && !result.success) {
        toast.error(result.error ?? 'Erro ao excluir paciente')
        setLoading(false)
        setOpen(false)
      }
      // Se sucesso, deletarPaciente faz redirect para /pacientes
    } catch {
      toast.error('Erro ao excluir paciente. Tente novamente.')
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/40 hover:bg-destructive hover:text-destructive-foreground"
          />
        }
      >
        <Trash2 className="h-4 w-4 mr-1.5" />
        Excluir
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Excluir paciente?</DialogTitle>
          <DialogDescription>
            O paciente <strong>{nomePaciente}</strong> será removido do sistema. Esta ação pode ser
            revertida pelo administrador caso necessário.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={loading} />}>
            Cancelar
          </DialogClose>
          <Button
            onClick={handleExcluir}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Excluindo...' : 'Sim, excluir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
