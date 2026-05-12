import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import supabase from '../supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const navigate = useNavigate()
    const location = useLocation()

    async function handleLogin(e) {
        e.preventDefault()
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
            setError(error.message)
        } else {
            const from = location.state?.from || '/dashboard'
            navigate(from, { replace: true })
        }
    }

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
            <div className="w-full max-w-sm flex flex-col gap-6">

                <div className="flex flex-col items-center gap-1 text-center">
                    <span className="text-2xl font-bold text-white">REPUFLOW</span>
                    <p className="text-sm text-slate-400">Sign in to your account</p>
                </div>

                <Card className="bg-slate-800 border border-slate-700 rounded-md">
                    <CardHeader className="px-4 pt-4 pb-2">
                        <CardTitle className="text-slate-100 text-base font-semibold">Welcome back</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <form onSubmit={handleLogin} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-slate-400 text-sm font-medium">Email</Label>
                                <Input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-slate-900 border border-slate-600 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-500 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-md"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-slate-400 text-sm font-medium">Password</Label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-slate-900 border border-slate-600 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-500 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-md"
                                />
                            </div>
                            {error && <p className="text-red-400 text-sm">{error}</p>}
                            <Button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                            >
                                Login
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-slate-400 text-sm text-center">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-blue-400 hover:text-blue-300 transition-colors">
                        Sign up
                    </Link>
                </p>

            </div>
        </div>
    )
}

export default Login
