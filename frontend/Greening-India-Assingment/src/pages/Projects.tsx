import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { projectsApi } from '../api/projects'
import ErrorState from '../components/ErrorState'
import Loader from '../components/Loader'
import type { Project } from '../types/project'
import { getErrorMessage } from '../utils/apiError'

function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async () => {
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
  }

  useEffect(() => {
    void fetchProjects()
  }, [])

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
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-600">Track progress across all active projects.</p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-800">No projects yet</h2>
          <p className="mt-1 text-sm text-slate-600">Create your first project from your backend API.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h2 className="text-lg font-semibold text-slate-900">{project.name}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-slate-600">{project.description}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>{project.taskCount ?? 0} tasks</span>
                <span>{project.completedTaskCount ?? 0} done</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

export default ProjectsPage
