import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage = () => {
    const { register, isLoading } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail]       = useState('');
    const [name, setName]         = useState('');
    const [password, setPassword] = useState('');
    const [error, setError]       = useState(null);
    const [success, setSuccess]   = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        try {
            await register(email, password, name);
            setSuccess('Account created! Redirecting to login...');
            setTimeout(() => navigate('/login'), 1000);
        } catch (err) {
            setError(err?.message || 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
            <div className="w-full max-w-md p-8 bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl">
                <h2 className="text-3xl font-bold mb-2 text-center">Create Account</h2>
                <p className="text-gray-400 text-center mb-8">Join CollabIDE to start collaborating</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your display name"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                            required
                        />
                    </div>

                    {error   && <div className="text-red-400 text-sm">{error}</div>}
                    {success && <div className="text-green-400 text-sm">{success}</div>}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold text-lg transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Creating account...' : 'Register'}
                    </button>
                </form>

                <div className="text-center mt-6 text-sm text-gray-400">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-400 hover:text-blue-300">Login</Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
