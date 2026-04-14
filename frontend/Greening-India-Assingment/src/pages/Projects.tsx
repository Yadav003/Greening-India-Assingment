import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { projectsApi } from '../api/projects'
import ErrorState from '../components/ErrorState'
import Loader from '../components/Loader'
import ToastStack from '../components/ToastStack'
import { useToast } from '../hooks/useToast'
import type { Project } from '../types/project'
import { getErrorMessage } from '../utils/apiError'
import { hasMinLength } from '../utils/validation'

function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [deletingProjectIds, setDeletingProjectIds] = useState<Record<string, boolean>>({})
  const [createName, setCreateName] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createFormError, setCreateFormError] = useState<string | null>(null)
  const { toasts, showToast, removeToast } = useToast()

  const fetchProjects = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const projectList = await projectsApi.getProjects()
      setProjects(projectList)
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not load projects.'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchProjects()
  }, [fetchProjects])

  const resetCreateForm = useCallback(() => {
    setCreateName('')
    setCreateDescription('')
    setCreateFormError(null)
  }, [])

  const openCreateModal = useCallback(() => {
    resetCreateForm()
    setIsCreateOpen(true)
  }, [resetCreateForm])

  const closeCreateModal = useCallback(() => {
    setIsCreateOpen(false)
  }, [])

  const handleCreateProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreateFormError(null)

    if (!hasMinLength(createName, 3)) {
      setCreateFormError('Project name must be at least 3 characters.')
      return
    }

    if (!hasMinLength(createDescription, 10)) {
      setCreateFormError('Description must be at least 10 characters.')
      return
    }

    setIsCreating(true)

    try {
      const createdProject = await projectsApi.createProject({
        name: createName.trim(),
        description: createDescription.trim(),
      })

      setProjects((previous) => [createdProject, ...previous])
      setIsCreateOpen(false)
      showToast({
        variant: 'success',
        title: 'Project created',
        message: `${createdProject.name} is ready.`,
      })
    } catch (requestError) {
      const errorMessage = getErrorMessage(requestError, 'Could not create project.')
      setCreateFormError(errorMessage)
      showToast({ variant: 'error', title: 'Create project failed', message: errorMessage })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteProject = useCallback(
    async (project: Project) => {
      const isConfirmed = window.confirm(
        `Delete "${project.name}" and all its tasks? This action cannot be undone.`,
      )

      if (!isConfirmed) {
        return
      }

      setDeletingProjectIds((previous) => ({ ...previous, [project.id]: true }))

      try {
        await projectsApi.deleteProject(project.id)
        setProjects((previous) => previous.filter((item) => item.id !== project.id))
        showToast({
          variant: 'success',
          title: 'Project deleted',
          message: `${project.name} was removed.`,
        })
      } catch (requestError) {
        showToast({
          variant: 'error',
          title: 'Delete project failed',
          message: getErrorMessage(requestError, 'Could not delete project.'),
        })
      } finally {
        setDeletingProjectIds((previous) => {
          const next = { ...previous }
          delete next[project.id]
          return next
        })
      }
    },
    [showToast],
  )

  if (isLoading) {
    return <Loader label="Loading projects..." />
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load projects"
        message={error}
        onRetry={() => {
          void fetchProjects()
        }}
      />
    )
  }

  return (
    <section className="space-y-6">
      <ToastStack toasts={toasts} onDismiss={removeToast} />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Projects</h1>
          <p className="text-sm text-slate-600">Track progress across all active projects.</p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Create Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">No projects yet</h2>
          <p className="mt-1 text-sm text-slate-600">Create your first project to start tracking tasks.</p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Create your first project
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <article
              key={project.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <Link to={`/projects/${project.id}`} className="group block">
                <h2 className="text-lg font-semibold text-slate-900 transition group-hover:text-slate-700">
                  {project.name}
                </h2>
                <p className="mt-2 text-sm text-slate-600">{project.description}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>{project.taskCount ?? 0} tasks</span>
                  <span>{project.completedTaskCount ?? 0} done</span>
                </div>
              </Link>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    void handleDeleteProject(project)
                  }}
                  disabled={Boolean(deletingProjectIds[project.id])}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingProjectIds[project.id] ? 'Deleting...' : 'Delete project'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Create project</h2>
              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-md px-2 py-1 text-sm text-slate-500 transition hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Project name</span>
                <input
                  type="text"
                  value={createName}
                  onChange={(event) => setCreateName(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                  placeholder="Q2 Product Launch"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Description</span>
                <textarea
                  value={createDescription}
                  onChange={(event) => setCreateDescription(event.target.value)}
                  className="h-28 w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                  placeholder="Summarize the scope and expected outcomes."
                />
              </label>

              {createFormError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {createFormError}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default ProjectsPage
