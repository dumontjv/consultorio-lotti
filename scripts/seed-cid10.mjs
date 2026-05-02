#!/usr/bin/env node
/**
 * Importa o CID-10 completo em português brasileiro (fonte: DATASUS via GitHub)
 *
 * Uso:
 *   node scripts/seed-cid10.mjs
 *
 * Requer variáveis de ambiente (crie um .env.local ou exporte antes de rodar):
 *   SUPABASE_URL=https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...
 *
 * Instale dotenv se necessário: npm install dotenv
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Mapeamento de capítulos CID-10
const CAPITULOS = [
  { inicio: 'A', fim: 'B', nome: 'Cap. I — Doenças infecciosas e parasitárias' },
  { inicio: 'C', fim: 'D48', nome: 'Cap. II — Neoplasias' },
  { inicio: 'D50', fim: 'D89', nome: 'Cap. III — Doenças do sangue e órgãos hematopoiéticos' },
  { inicio: 'E', fim: 'E', nome: 'Cap. IV — Doenças endócrinas, nutricionais e metabólicas' },
  { inicio: 'F', fim: 'F', nome: 'Cap. V — Transtornos mentais e comportamentais' },
  { inicio: 'G', fim: 'G', nome: 'Cap. VI — Doenças do sistema nervoso' },
  { inicio: 'H00', fim: 'H59', nome: 'Cap. VII — Doenças do olho e anexos' },
  { inicio: 'H60', fim: 'H95', nome: 'Cap. VIII — Doenças do ouvido' },
  { inicio: 'I', fim: 'I', nome: 'Cap. IX — Doenças do aparelho circulatório' },
  { inicio: 'J', fim: 'J', nome: 'Cap. X — Doenças do aparelho respiratório' },
  { inicio: 'K', fim: 'K', nome: 'Cap. XI — Doenças do aparelho digestivo' },
  { inicio: 'L', fim: 'L', nome: 'Cap. XII — Doenças da pele e tecido subcutâneo' },
  { inicio: 'M', fim: 'M', nome: 'Cap. XIII — Doenças do sistema osteomuscular' },
  { inicio: 'N', fim: 'N', nome: 'Cap. XIV — Doenças do aparelho geniturinário' },
  { inicio: 'O', fim: 'O', nome: 'Cap. XV — Gravidez, parto e puerpério' },
  { inicio: 'P', fim: 'P', nome: 'Cap. XVI — Afecções originadas no período perinatal' },
  { inicio: 'Q', fim: 'Q', nome: 'Cap. XVII — Malformações congênitas' },
  { inicio: 'R', fim: 'R', nome: 'Cap. XVIII — Sintomas e sinais' },
  { inicio: 'S', fim: 'T', nome: 'Cap. XIX — Lesões e envenenamentos' },
  { inicio: 'V', fim: 'Y', nome: 'Cap. XX — Causas externas' },
  { inicio: 'Z', fim: 'Z', nome: 'Cap. XXI — Fatores que influenciam o estado de saúde' },
  { inicio: 'U', fim: 'U', nome: 'Cap. XXII — Códigos para propósitos especiais' },
]

function getCapitulo(codigo) {
  const letra = codigo[0].toUpperCase()
  const numero = parseInt(codigo.slice(1, 3)) || 0
  const codigoNum = letra + codigo.slice(1, 3).padStart(2, '0')

  for (const cap of CAPITULOS) {
    if (cap.inicio.length === 1 && cap.fim.length === 1) {
      if (letra >= cap.inicio && letra <= cap.fim) return cap.nome
    } else if (cap.inicio.length === 1) {
      // início de letra única, fim com número
      if (letra === cap.inicio[0] && codigoNum <= cap.fim) return cap.nome
      if (letra > cap.inicio[0] && letra <= cap.fim.slice(-1)) return cap.nome
    } else {
      // ambos com letra+número
      if (codigoNum >= cap.inicio && codigoNum <= cap.fim) return cap.nome
    }
  }
  return null
}

function parseSql(sql) {
  const results = []
  // Extrai VALUES ('CODE','DESCRICAO') de cada INSERT
  const regex = /VALUES\s*\('([^']+)','((?:[^']|'')+)'\)/gi
  let match
  while ((match = regex.exec(sql)) !== null) {
    const codigo = match[1].trim()
    const descricao = match[2].replace(/''/g, "'").trim()
    results.push({ codigo, descricao })
  }
  return results
}

async function fetchSql(url) {
  console.log(`  ⬇  Baixando ${url}`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar ${url}`)
  return res.text()
}

async function upsertBatch(rows) {
  const { error } = await supabase
    .from('cid_codigos')
    .upsert(rows, { onConflict: 'versao,codigo' })
  if (error) throw error
}

async function main() {
  console.log('\n🔵 Iniciando importação CID-10 completo (PT-BR)\n')

  const baseUrl = 'https://raw.githubusercontent.com/lucasrafagnin/CID10-SQL/master'

  // ── Importar subcategorias (4 dígitos) ──────────────────────────────────
  console.log('📂 Subcategorias (códigos completos)...')
  const subSql = await fetchSql(`${baseUrl}/subcategoria.sql`)
  const subcats = parseSql(subSql)
  console.log(`  ✔ ${subcats.length} subcategorias encontradas`)

  const subRows = subcats.map(({ codigo, descricao }) => ({
    versao: 'cid10',
    codigo,
    descricao,
    categoria: codigo.slice(0, 3),
    capitulo: getCapitulo(codigo),
  }))

  const CHUNK = 200
  let inserted = 0
  for (let i = 0; i < subRows.length; i += CHUNK) {
    await upsertBatch(subRows.slice(i, i + CHUNK))
    inserted += Math.min(CHUNK, subRows.length - i)
    process.stdout.write(`\r  ↳ ${inserted}/${subRows.length} inseridos...`)
  }
  console.log(`\n  ✅ Subcategorias concluído\n`)

  // ── Importar categorias (3 dígitos) ─────────────────────────────────────
  console.log('📂 Categorias (3 dígitos)...')
  const catSql = await fetchSql(`${baseUrl}/categoria.sql`)
  const cats = parseSql(catSql)
  console.log(`  ✔ ${cats.length} categorias encontradas`)

  const catRows = cats.map(({ codigo, descricao }) => ({
    versao: 'cid10',
    codigo,
    descricao,
    categoria: codigo,
    capitulo: getCapitulo(codigo),
  }))

  inserted = 0
  for (let i = 0; i < catRows.length; i += CHUNK) {
    await upsertBatch(catRows.slice(i, i + CHUNK))
    inserted += Math.min(CHUNK, catRows.length - i)
    process.stdout.write(`\r  ↳ ${inserted}/${catRows.length} inseridos...`)
  }
  console.log(`\n  ✅ Categorias concluído\n`)

  const total = subRows.length + catRows.length
  console.log(`🎉 Importação CID-10 concluída! ${total} códigos importados.\n`)
}

main().catch((err) => {
  console.error('\n❌ Erro durante importação:', err.message)
  process.exit(1)
})
