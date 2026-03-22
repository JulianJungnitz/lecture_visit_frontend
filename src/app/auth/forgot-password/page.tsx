'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail } from 'lucide-react'
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')

    const supabase = createClient()
    const origin = window.location.origin

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/confirm`,
    })

    // Show success regardless — don't leak whether email exists
    setStatus('sent')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Reset your password</CardTitle>
          <CardDescription>Enter your email to receive a reset link</CardDescription>
        </CardHeader>

        {status === 'sent' ? (
          <CardContent className="text-center space-y-2">
            <Mail className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="text-sm font-medium">Check your email</p>
            <p className="text-sm text-muted-foreground">
              If an account exists for{' '}
              <span className="font-medium text-foreground">{email}</span>, you&apos;ll receive a
              reset link.
            </p>
            <Link
              href="/auth/login"
              className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Back to login
            </Link>
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
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                className="w-full bg-black hover:bg-black/90 text-white"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Sending...' : 'Send reset link'}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Remember your password?{' '}
                <Link
                  href="/auth/login"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Log in
                </Link>
              </p>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}
