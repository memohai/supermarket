import { defineHandler } from 'nitro'
import { getAllMcpTags } from '../utils/mcp-loader'
import { getAllSkillTags } from '../utils/skill-loader'

export default defineHandler(async () => {
  const [mcpTags, skillTags] = await Promise.all([getAllMcpTags(), getAllSkillTags()])
  const merged = new Set([...mcpTags, ...skillTags])
  return { tags: [...merged].sort() }
})
