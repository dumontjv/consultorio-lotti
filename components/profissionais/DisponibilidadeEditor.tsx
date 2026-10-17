'use client'

import { useState } from 'react'

export interface DisponibilidadeDia {
  ativo: boolean
  horarios: Array<{ inicio: string; fim: string }>
}

export type Disponibilidade = Record<string, DisponibilidadeDia>

const DIAS = [
  { key: 'segunda', label: 'Segunda-feira' },
  { key: 'terca', label: 'Terça-feira' },
  { key: 'quarta', label: 'Quarta-feira' },
  { key: 'quinta', label: 'Quinta-feira' },
  { key: 'sexta', label: 'Sexta-feira' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
]

const DEFAULT_HORARIO = { inicio: '08:00', fim: '18:00' }

function diaDefault(): DisponibilidadeDia {
  return { ativo: false, horarios: [{ ...DEFAULT_HORARIO }] }
}

interface DisponibilidadeEditorProps {
  value: Disponibilidade
  onChange: (v: Disponibilidade) => void
}

export function DisponibilidadeEditor({ value, onChange }: DisponibilidadeEditorProps) {
  function setDia(key: string, dia: DisponibilidadeDia) {
    onChange({ ...value, [key]: dia })
  }

  function toggleDia(key: string) {
    const atual = value[key] ?? diaDefault()
    setDia(key, { ...atual, ativo: !atual.ativo })
  }

  function setHorario(diaKey: string, idx: number, field: 'inicio' | 'fim', val: string) {
    const dia = value[diaKey] ?? diaDefault()
    const horarios = dia.horarios.map((h, i) => (i === idx ? { ...h, [field]: val } : h))
    setDia(diaKey, { ...dia, horarios })
  }

  function adicionarHorario(diaKey: string) {
    const dia = value[diaKey] ?? diaDefault()
    setDia(diaKey, {
      ...dia,
      horarios: [...dia.horarios, { ...DEFAULT_HORARIO }],
    })
  }

  function removerHorario(diaKey: string, idx: number) {
    const dia = value[diaKey] ?? diaDefault()
    setDia(diaKey, {
      ...dia,
      horarios: dia.horarios.filter((_, i) => i !== idx),
    })
  }

  return (
    <div className="space-y-2">
      {DIAS.map(({ key, label }) => {
        const dia = value[key] ?? diaDefault()
        return (
          <div
            key={key}
            className={`rounded-lg border border-input p-3 transition-colors ${
              dia.ativo ? 'bg-white' : 'bg-muted/30 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">{label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={dia.ativo}
                onClick={() => toggleDia(key)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  dia.ativo ? 'bg-teal-500' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    dia.ativo ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {dia.ativo && (
              <div className="space-y-1.5">
                {dia.horarios.map((h, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={h.inicio}
                      onChange={(e) => setHorario(key, idx, 'inicio', e.target.value)}
                      className="h-8 rounded-md border border-input bg-background px-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <span className="text-slate-400 text-xs">até</span>
                    <input
                      type="time"
                      value={h.fim}
                      onChange={(e) => setHorario(key, idx, 'fim', e.target.value)}
                      className="h-8 rounded-md border border-input bg-background px-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    {dia.horarios.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removerHorario(key, idx)}
                        className="text-xs text-rose-500 hover:text-rose-600 px-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => adicionarHorario(key)}
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium mt-1"
                >
                  + Adicionar horário
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
