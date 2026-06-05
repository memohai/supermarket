import { defineHandler } from 'nitro'
import { getAllPluginTags } from '../utils/plugin-loader'
import { getAllSkillTags } from '../utils/skill-loader'

export default defineHandler(async () => {
  const [pluginTags, skillTags] = await Promise.all([getAllPluginTags(), getAllSkillTags()])
  const merged = new Set([...pluginTags, ...skillTags])
  return { tags: [...merged].sort() }
})
