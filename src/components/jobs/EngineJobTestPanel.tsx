import {
  Ban,
  CheckCircle2,
  FlaskConical,
  LoaderCircle,
  Trash2,
  XCircle,
} from 'lucide-react'

import {
  useJobStore,
} from '../../store/useJobStore'

export function EngineJobTestPanel() {
  const jobs =
    useJobStore(
      (state) => state.jobs,
    )

  const activeJobId =
    useJobStore(
      (state) =>
        state.activeJobId,
    )

  const startJob =
    useJobStore(
      (state) =>
        state.startJob,
    )

  const cancelJob =
    useJobStore(
      (state) =>
        state.cancelJob,
    )

  const clearJob =
    useJobStore(
      (state) =>
        state.clearJob,
    )

  const activeJob =
    activeJobId
      ? jobs[activeJobId] ??
        null
      : null

  const isBusy =
    activeJob?.status ===
      'queued' ||
    activeJob?.status ===
      'running'

  const isFinished =
    activeJob?.status ===
      'completed' ||
    activeJob?.status ===
      'failed' ||
    activeJob?.status ===
      'cancelled'

  const runDemo =
    async (): Promise<void> => {
      await startJob({
        kind: 'demo',

        payload: {
          steps: 25,
          delayMs: 120,
        },
      })
    }

  return (
    <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/55 p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical
              size={18}
              className="text-violet-300"
            />

            <h2 className="font-semibold text-white">
              Tes Document Job System
            </h2>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Menguji IPC, proses Python,
            progress, hasil, error, dan
            pembatalan.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={isBusy}
            onClick={() =>
              void runDemo()
            }
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBusy ? (
              <LoaderCircle
                size={16}
                className="animate-spin"
              />
            ) : (
              <FlaskConical
                size={16}
              />
            )}

            Jalankan Demo
          </button>

          {isBusy &&
            activeJob && (
              <button
                type="button"
                onClick={() =>
                  void cancelJob(
                    activeJob.jobId,
                  )
                }
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-500/40 px-4 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
              >
                <Ban size={16} />
                Batalkan
              </button>
            )}

          {isFinished &&
            activeJob && (
              <button
                type="button"
                onClick={() =>
                  clearJob(
                    activeJob.jobId,
                  )
                }
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
              >
                <Trash2
                  size={16}
                />

                Bersihkan
              </button>
            )}
        </div>
      </div>

      {activeJob && (
        <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              {activeJob.status ===
                'completed' && (
                <CheckCircle2
                  size={16}
                  className="text-emerald-400"
                />
              )}

              {activeJob.status ===
                'failed' && (
                <XCircle
                  size={16}
                  className="text-red-400"
                />
              )}

              {activeJob.status ===
                'cancelled' && (
                <Ban
                  size={16}
                  className="text-amber-400"
                />
              )}

              {(
                activeJob.status ===
                  'queued' ||
                activeJob.status ===
                  'running'
              ) && (
                <LoaderCircle
                  size={16}
                  className="animate-spin text-blue-400"
                />
              )}

              <span className="font-medium text-slate-300">
                {
                  activeJob.message
                }
              </span>
            </div>

            <span className="font-mono text-slate-500">
              {
                activeJob.progress
              }
              %
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-blue-500 transition-[width] duration-200"
              style={{
                width:
                  `${activeJob.progress}%`,
              }}
            />
          </div>

          {activeJob.error && (
            <p className="mt-3 rounded-lg bg-red-500/10 p-3 text-xs text-red-300">
              {
                activeJob.error
              }
            </p>
          )}

          {activeJob.result !==
            undefined && (
            <pre className="mt-3 overflow-auto rounded-lg bg-black/30 p-3 text-xs text-emerald-300">
              {JSON.stringify(
                activeJob.result,
                null,
                2,
              )}
            </pre>
          )}
        </div>
      )}
    </section>
  )
}