'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MoreHorizontal, Pencil, CheckCircle, XCircle, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { EditarLancamentoModal, type LancamentoParaEditar } from './EditarLancamentoModal'
import { marcarComoPago, cancelarLancamento } from '@/app/(app)/financeiro/actions'

interface AcoesLancamentoProps {
  lancamento: LancamentoParaEditar
  profissionais: { id: string; nome_completo: string; role: string }[]
}

export function AcoesLancamento({ lancamento, profissionais }: AcoesLancamentoProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [editOpen, setEditOpen] = useState(false)
  const [pagarOpen, setPagarOpen] = useState(false)
  const [cancelarOpen, setCancelarOpen] = useState(false)
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  const podeMarcarPago = lancamento.status === 'pendente'
  const podeCancelar = lancamento.status !== 'cancelado' && lancamento.status !== 'estornado'

  async function handleMarcarPago() {
    setLoading(true)
    try {
      const result = await marcarComoPago(lancamento.id, dataPagamento)
      if (!result.success) { toast.error(result.error); return }
      toast.success('Lançamento marcado como pago!')
      setPagarOpen(false)
      startTransition(() => { router.refresh() })
    } finally {
      setLoading(false)
    }
  }

  async function handleCancelar() {
    setLoading(true)
    try {
      const result = await cancelarLancamento(lancamento.id)
      if (!result.success) { toast.error(result.error); return }
      toast.success('Lançamento cancelado.')
      setCancelarOpen(false)
      startTransition(() => { router.refresh() })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-accent hover:text-accent-foreground transition-colors">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ações</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
          {podeMarcarPago && (
            <DropdownMenuItem onClick={() => setPagarOpen(true)}>
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Marcar como pago
            </DropdownMenuItem>
          )}
          {podeCancelar && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setCancelarOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar lançamento
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal de edição */}
      <EditarLancamentoModal
        lancamento={lancamento}
        profissionais={profissionais}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      {/* Dialog: marcar como pago */}
      <Dialog open={pagarOpen} onOpenChange={setPagarOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-slate-600">
              Confirme a data de pagamento de <strong>{lancamento.descricao}</strong>.
            </p>
            <div className="space-y-1">
              <Label htmlFor="data-pag">Data de pagamento</Label>
              <Input
                id="data-pag"
                type="date"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPagarOpen(false)} disabled={loading}>
              Voltar
            </Button>
            <Button onClick={handleMarcarPago} disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : 'Confirmar pagamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: cancelar lançamento */}
      <Dialog open={cancelarOpen} onOpenChange={setCancelarOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancelar lançamento?</DialogTitle>
            <DialogDescription>
              O lançamento <strong>{lancamento.descricao}</strong> será marcado como cancelado.
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelarOpen(false)} disabled={loading}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelar}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Cancelar lançamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
