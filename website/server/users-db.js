import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const usersDbPath = path.join(__dirname, 'data', 'users.json')

const adapter = new JSONFile(usersDbPath)
const usersDb = new Low(adapter, [])

export default usersDb
