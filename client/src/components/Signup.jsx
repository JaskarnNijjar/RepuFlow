import { useState } from 'react'
import { Link } from 'react-router-dom'
import supabase from '../supabase'

function Signup() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const [message, setMessage] = useState(null)

    async function handleSignup(e) {
        e.preventDefault()
        const { error } = await supabase.auth.signUp({
            email: email,
            password: password,
        })
        if (error) {
            setError(error.message)
        } else {
            setMessage('Check your email to confirm your account!')
        }
    }

    return (
        <div>
            <h2>Sign Up</h2>
            <form onSubmit={handleSignup}>
                <input
                type='email'
                placeholder='Email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
                <input
                type='password'
                placeholder='Password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                />
                <button type='submit'>Sign Up</button>
            </form>
            {error && <p>{error}</p>}
            {message && <p>{message}</p>}
            <p>Already have an account? <Link to="/">Log in</Link></p>
        </div>
    )
}

export default Signup
