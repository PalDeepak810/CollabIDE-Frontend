import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
    const { login, isLoading } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [error, setError]       = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await login(email, password);
            navigate('/create');
        } catch (err) {
            setError(err?.message || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
            <div className="w-full max-w-md p-8 bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl">
                <h2 className="text-3xl font-bold mb-2 text-center">Welcome Back</h2>
                <p className="text-gray-400 text-center mb-8">Login to continue collaborating</p>

                <form onSubmit={handleSubmit} className="space-y-6">
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

                    {error && <div className="text-red-400 text-sm">{error}</div>}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-lg transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="text-center mt-6 text-sm text-gray-400">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-blue-400 hover:text-blue-300">Register</Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
