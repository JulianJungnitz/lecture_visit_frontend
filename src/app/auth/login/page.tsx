'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Mail } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    const supabase = createClient()

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/confirm`,
      },
    })

    if (error) {
      setStatus('error')
      setErrorMessage(error.message)
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Lecture Visit</CardTitle>
          <CardDescription>
            Sign in with your email to continue
          </CardDescription>
        </CardHeader>

        {status === 'sent' ? (
          <CardContent className="text-center space-y-2">
            <Mail className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="text-sm font-medium">Check your email</p>
            <p className="text-sm text-muted-foreground">
              We sent a magic link to <span className="font-medium text-foreground">{email}</span>
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Use a different email
            </button>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  disabled={status === 'loading'}
                />
              </div>
              {status === 'error' && (
                <p className="text-sm text-red-500">{errorMessage}</p>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-black hover:bg-black/90 text-white" disabled={status === 'loading'}>
                {status === 'loading' ? 'Sending...' : 'Send magic link'}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}
