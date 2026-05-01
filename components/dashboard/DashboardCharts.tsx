'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, BarChart2 } from 'lucide-react'

export interface ReceitaMensalItem {
  mes: string
  valor: number
}

export interface ConsultasProfItem {
  nome: string
  total: number
  role: string
}

interface Props {
  receitaMensal: ReceitaMensalItem[]
  consultasPorProfissional: ConsultasProfItem[]
}

const ROLE_COLORS: Record<string, string> = {
  medica:    '#14b8a6',
  psicologa: '#6366f1',
  admin:     '#94a3b8',
}

function formatMoeda(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TooltipReceita({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-100 rounded-lg shadow px-3 py-2 text-sm">
      <p className="font-medium text-slate-700 mb-1">{label}</p>
      <p className="text-green-700 font-bold">{formatMoeda(payload[0].value)}</p>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TooltipConsultas({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-100 rounded-lg shadow px-3 py-2 text-sm">
      <p className="font-medium text-slate-700">{payload[0].name}</p>
      <p className="text-slate-600">
        {payload[0].value} consulta{payload[0].value !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

export function DashboardCharts({ receitaMensal, consultasPorProfissional }: Props) {
  const temReceita   = receitaMensal.some((r) => r.valor > 0)
  const temConsultas = consultasPorProfissional.some((c) => c.total > 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Receita mensal */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            Receita recebida — últimos 6 meses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!temReceita ? (
            <div className="flex items-center justify-center h-44 text-slate-300 text-sm">
              Sem dados de receita no período
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={receitaMensal} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                  width={42}
                />
                <Tooltip content={<TooltipReceita />} />
                <Bar dataKey="valor" fill="#14b8a6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Consultas por profissional */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-indigo-400" />
            Consultas por profissional — mês atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!temConsultas ? (
            <div className="flex items-center justify-center h-44 text-slate-300 text-sm">
              Sem consultas registradas este mês
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={consultasPorProfissional}
                  dataKey="total"
                  nameKey="nome"
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={72}
                  paddingAngle={2}
                >
                  {consultasPorProfissional.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={ROLE_COLORS[entry.role] ?? '#94a3b8'}
                    />
                  ))}
                </Pie>
                <Tooltip content={<TooltipConsultas />} />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs text-slate-600">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
