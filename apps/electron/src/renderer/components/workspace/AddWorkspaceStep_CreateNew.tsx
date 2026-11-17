import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { ArrowLeft, FileText, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { slugify } from "@/lib/slugify"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { AddWorkspaceContainer, AddWorkspaceStepHeader, AddWorkspaceSecondaryButton, AddWorkspacePrimaryButton } from "./primitives"
import { AddWorkspace_RadioOption } from "./AddWorkspace_RadioOption"
import { useDirectoryPicker } from "@/hooks/useDirectoryPicker"
import { ServerDirectoryBrowser } from "@/components/ServerDirectoryBrowser"

type LocationOption = 'default' | 'custom'

interface EnterpriseTemplate {
  id: string
  name: string
  description: string
  version: string
  category: string
  agentProfile: string
  skillCount: number
  taskCount: number
  requiredSources: string[]
}

interface AddWorkspaceStep_CreateNewProps {
  onBack: () => void
  onCreate: (folderPath: string, name: string, remoteServer?: { url: string; token: string; remoteWorkspaceId: string }, templateId?: string) => Promise<void>
  isCreating: boolean
}

/**
 * AddWorkspaceStep_CreateNew - Create a new workspace
 *
 * Fields:
 * - Enterprise template (optional, with graceful degradation)
 * - Workspace name (required)
 * - Location: Default (~/.craft-agent/workspaces/) or Custom
 */
export function AddWorkspaceStep_CreateNew({
  onBack,
  onCreate,
  isCreating
}: AddWorkspaceStep_CreateNewProps) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [locationOption, setLocationOption] = useState<LocationOption>('default')
  const [customPath, setCustomPath] = useState<string | null>(null)
  const [homeDir, setHomeDir] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  // Enterprise template state
  const [templates, setTemplates] = useState<EnterpriseTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined)
  const [templatesLoading, setTemplatesLoading] = useState(true)

  // Get home directory on mount
  useEffect(() => {
    window.electronAPI.getHomeDir().then(setHomeDir)
  }, [])

  // Load enterprise templates on mount (graceful degradation)
  useEffect(() => {
    let cancelled = false
    setTemplatesLoading(true)

    window.electronAPI.listEnterpriseTemplates()
      .then((result) => {
        if (!cancelled) {
          setTemplates(result ?? [])
        }
      })
      .catch(() => {
        // Templates not available (old server, missing resources, etc.)
        // Silently degrade — user can still create blank workspace
        if (!cancelled) {
          setTemplates([])
        }
      })
      .finally(() => {
        if (!cancelled) {
          setTemplatesLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [])

  const slug = slugify(name)
  const defaultBasePath = homeDir ? `${homeDir}/.craft-agent/workspaces` : null
  const finalPath = locationOption === 'default'
    ? (defaultBasePath && slug ? `${defaultBasePath}/${slug}` : null)
    : customPath && slug
      ? `${customPath}/${slug}`
      : null

  // Validate slug uniqueness when name changes
  useEffect(() => {
    if (!slug) {
      setError(null)
      return
    }

    const validateSlug = async () => {
      setIsValidating(true)
      try {
        const result = await window.electronAPI.checkWorkspaceSlug(slug)
        if (result.exists) {
          setError(`A workspace named "${slug}" already exists`)
        } else {
          setError(null)
        }
      } catch (err) {
        console.error('Failed to validate workspace slug:', err)
      } finally {
        setIsValidating(false)
      }
    }

    // Debounce validation
    const timeout = setTimeout(validateSlug, 300)
    return () => clearTimeout(timeout)
  }, [slug])

  const handleFolderSelected = useCallback((path: string) => {
    setCustomPath(path)
  }, [])

  const {
    pickDirectory,
    showServerBrowser,
    serverBrowserMode,
    cancelServerBrowser,
    confirmServerBrowser,
  } = useDirectoryPicker(handleFolderSelected)

  const handleCreate = useCallback(async () => {
    if (!name.trim() || !finalPath || error) return
    await onCreate(finalPath, name.trim(), undefined, selectedTemplateId)
  }, [name, finalPath, error, selectedTemplateId, onCreate])

  const canCreate = name.trim() && finalPath && !error && !isValidating && !isCreating

  return (
    <AddWorkspaceContainer>
      {/* Back button */}
      <button
        onClick={onBack}
        disabled={isCreating}
        className={cn(
          "self-start flex items-center gap-1 text-sm text-muted-foreground",
          "hover:text-foreground transition-colors mb-4",
          isCreating && "opacity-50 cursor-not-allowed"
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        {t("common.back")}
      </button>

      <AddWorkspaceStepHeader
        title={t("workspace.createWorkspace")}
        description={t("workspace.createWorkspaceDesc")}
      />

      <div className="mt-6 w-full space-y-6">
        {/* Enterprise template selection (only shown when templates are available) */}
        {!templatesLoading && templates.length > 0 && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground mb-2.5">
              {t("workspace.templateLabel")}
            </label>

            {/* Blank workspace option */}
            <button
              onClick={() => setSelectedTemplateId(undefined)}
              disabled={isCreating}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                selectedTemplateId === undefined
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-foreground-5",
                isCreating && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-md",
                selectedTemplateId === undefined ? "bg-primary/10" : "bg-muted"
              )}>
                {selectedTemplateId === undefined ? (
                  <CheckCircle className="h-4 w-4 text-primary" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{t("workspace.blankWorkspace")}</p>
                <p className="text-xs text-muted-foreground">{t("workspace.blankWorkspaceDesc")}</p>
              </div>
            </button>

            {/* Template options */}
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplateId(template.id)}
                disabled={isCreating}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                  selectedTemplateId === template.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-foreground-5",
                  isCreating && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-md",
                  selectedTemplateId === template.id ? "bg-primary/10" : "bg-muted"
                )}>
                  {selectedTemplateId === template.id ? (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{template.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{template.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {template.skillCount > 0 && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {template.skillCount} {t("workspace.skillsCount")}
                      </span>
                    )}
                    {template.taskCount > 0 && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {template.taskCount} {t("workspace.tasksCount")}
                      </span>
                    )}
                    {template.requiredSources.length > 0 && (
                      <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded">
                        {t("workspace.requiresSources")}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Workspace name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground mb-2.5">
            {t("workspace.nameLabel")}
          </label>
          <div className="bg-background shadow-minimal rounded-lg">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("workspace.myWorkspace")}
              disabled={isCreating}
              autoFocus
              className="border-0 bg-transparent shadow-none"
            />
          </div>
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>

        {/* Location selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-foreground mb-2.5">
            {t("workspace.locationLabel")}
          </label>

          {/* Default location option */}
          <AddWorkspace_RadioOption
            name="location"
            checked={locationOption === 'default'}
            onChange={() => setLocationOption('default')}
            disabled={isCreating}
            title={t("workspace.defaultLocation")}
            subtitle={t("workspace.underDefaultFolder")}
          />

          {/* Custom location option */}
          <AddWorkspace_RadioOption
            name="location"
            checked={locationOption === 'custom'}
            onChange={() => setLocationOption('custom')}
            disabled={isCreating}
            title={t("workspace.chooseLocation")}
            subtitle={customPath || t("workspace.pickLocation")}
            action={locationOption === 'custom' ? (
              <AddWorkspaceSecondaryButton
                onClick={(e) => {
                  e.preventDefault()
                  pickDirectory()
                }}
                disabled={isCreating}
              >
                {t("common.browse")}
              </AddWorkspaceSecondaryButton>
            ) : undefined}
          />
        </div>

        {/* Create button */}
        <AddWorkspacePrimaryButton
          onClick={handleCreate}
          disabled={!canCreate}
          loading={isCreating}
          loadingText={t("workspace.creating")}
        >
          {t("common.create")}
        </AddWorkspacePrimaryButton>
      </div>
      <ServerDirectoryBrowser
        open={showServerBrowser}
        mode={serverBrowserMode}
        onSelect={confirmServerBrowser}
        onCancel={cancelServerBrowser}
      />
    </AddWorkspaceContainer>
  )
}
