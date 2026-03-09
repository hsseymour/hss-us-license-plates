import fs from 'fs'
import path from 'path'

const root = './plates'
const manifest = {}
for (const state of fs.readdirSync(root)) {
  const dir = path.join(root, state)
  if (!fs.statSync(dir).isDirectory()) continue
  manifest[state] = fs.readdirSync(dir).filter(f => f.endsWith('.webp'))
}
fs.writeFileSync(`${root}/manifest.json`, JSON.stringify(manifest, null, 2))