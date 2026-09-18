import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { apiFetch, setToken } from '../../api/client'
import { applyFormError } from '../../api/errors'
import type { AuthTokenResponse } from '../../api/types'

interface LoginFormValues {
  email: string
  password: string
}

export default function Login() {
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>()

  async function onSubmit(values: LoginFormValues) {
    setFormError(null)

    try {
      const { token } = await apiFetch<AuthTokenResponse>('/login', {
        method: 'POST',
        body: JSON.stringify(values),
      })

      setToken(token)
      navigate('/zapasy', { replace: true })
    } catch (error) {
      const message = applyFormError(error, setError)
      if (message) {
        setFormError(message)
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-brand-950 px-5 py-10 sm:items-center">
      <div className="mx-auto mb-10 flex w-full max-w-sm flex-col items-center gap-3 text-center sm:mb-8">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold text-white">
          T
        </span>
        <h1 className="text-2xl font-extrabold text-white">Vítej zpět</h1>
        <p className="text-sm text-brand-100/70">Přihlas se a otipuj další kolo.</p>
      </div>

      <div className="mx-auto w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl shadow-brand-950/40 sm:p-7">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              {...register('email', { required: 'E-mail je povinný.' })}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Heslo
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              {...register('password', { required: 'Heslo je povinné.' })}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 rounded-full bg-brand-600 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Přihlašuji…' : 'Přihlásit se'}
          </button>
        </form>
      </div>
    </div>
  )
}
