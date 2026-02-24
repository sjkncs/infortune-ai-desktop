import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, 'data', 'db.json')

const adapter = new JSONFile(dbPath)
const db = new Low(adapter, {
  stocks: [],
  portfolio: [],
  valuation: []
})

export default db