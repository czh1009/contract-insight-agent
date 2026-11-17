/**
 * Enterprise Templates RPC Handlers
 *
 * Handles template discovery and installation on the server side.
 * - LIST: Returns available templates from bundled resources
 * - INSTALL: Installs a template into a workspace (creates workspace if needed)
 */

import { RPC_CHANNELS } from '@craft-agent/shared/protocol'
import { getBundledAssetsDir } from '@craft-agent/shared/utils'
import type { RpcServer } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from '../handler-deps'
import type { ServerHandlerContext } from '../../bootstrap/headless-start'

export const HANDLED_CHANNELS = [
  RPC_CHANNELS.enterpriseTemplates.LIST,
  RPC_CHANNELS.enterpriseTemplates.INSTALL,
] as const

/**
 * Resolve the enterprise templates directory using bundled assets.
 */
function resolveTemplatesDir(): string | null {
  return getBundledAssetsDir('enterprise-templates') ?? null
}

export function registerEnterpriseTemplateHandlers(
  server: RpcServer,
  deps: HandlerDeps,
  _serverCtx?: ServerHandlerContext,
): void {
  // -----------------------------------------------------------------------
  // List available enterprise templates
  // -----------------------------------------------------------------------
  server.handle(RPC_CHANNELS.enterpriseTemplates.LIST, async () => {
    const templatesDir = resolveTemplatesDir()
    if (!templatesDir) {
      return []
    }

    try {
      const { discoverTemplates } = await import('@craft-agent/shared/enterprise')
      return discoverTemplates(templatesDir)
    } catch (e) {
      deps.platform.logger.warn(`[enterpriseTemplates:list] Failed to discover templates: ${e instanceof Error ? e.message : 'Unknown error'}`)
      return []
    }
  })

  // -----------------------------------------------------------------------
  // Install an enterprise template into a workspace
  // -----------------------------------------------------------------------
  server.handle(RPC_CHANNELS.enterpriseTemplates.INSTALL, async (
    _ctx,
    templateId: string,
    workspaceRoot: string,
    workspaceName: string,
  ) => {
    if (!templateId?.trim()) throw new Error('Template ID is required')
    if (!workspaceRoot?.trim()) throw new Error('Workspace root path is required')
    if (!workspaceName?.trim()) throw new Error('Workspace name is required')

    const templatesDir = resolveTemplatesDir()
    if (!templatesDir) {
      throw new Error('Enterprise templates directory not found')
    }

    const { installEnterpriseTemplate } = await import('@craft-agent/shared/enterprise')
    const result = installEnterpriseTemplate(
      templatesDir,
      templateId.trim(),
      workspaceRoot.trim(),
      workspaceName.trim(),
    )

    if (!result.success) {
      throw new Error(result.error || 'Template installation failed')
    }

    return result
  })
}
