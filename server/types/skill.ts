export interface SkillAuthor {
  name: string
  email: string
}

export interface SkillMetadata {
  author: SkillAuthor
  tags?: string[]
  homepage?: string
}

export interface SkillConfig {
  id: string
  name: string
  description: string
  metadata: SkillMetadata
  content: string
  files: string[]
}
