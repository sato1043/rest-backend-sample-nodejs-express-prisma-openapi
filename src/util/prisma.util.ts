import { createPrismaClient } from '../config'

export async function queryCurrentDatabase(
  prisma: ReturnType<typeof createPrismaClient>,
): Promise<{ ip: string; db: string }> {
  return await prisma.$queryRaw`SELECT SUBSTRING_INDEX(host,':',1) as 'ip', db FROM information_schema.processlist WHERE ID=connection_id()`
}
