import { defineHandler, HTTPError } from 'nitro'
import { getRouterParam, setResponseHeader } from 'h3'
import { getSkillById, getSkillFiles } from '../../../utils/skill-loader'
import { createTar, gzip } from '../../../utils/tar'

export default defineHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const skill = await getSkillById(id)
  if (!skill) {
    throw new HTTPError(`Skill "${id}" not found`, { statusCode: 404 })
  }

  const files = await getSkillFiles(id)
  const tar = createTar(files, id)
  const compressed = await gzip(tar)

  setResponseHeader(event, 'content-type', 'application/gzip')
  setResponseHeader(event, 'content-disposition', `attachment; filename="${id}.tar.gz"`)
  return compressed
})
