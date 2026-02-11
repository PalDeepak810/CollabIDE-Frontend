import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LandingPage = () => {
    const { isAuthenticated } = useAuth();
    return (
        <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden">
            <div className="absolute inset-0">
                <div className="absolute -top-20 -left-24 w-[520px] h-[520px] bg-emerald-500/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/3 -right-32 w-[520px] h-[520px] bg-blue-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
                <header className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-emerald-300">CollabIDE</div>
                    <div className="flex items-center gap-4 text-sm">
                        {isAuthenticated ? (
                            <Link to="/create" className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-md font-semibold">Start Session</Link>
                        ) : (
                            <>
                                <Link to="/login" className="text-gray-300 hover:text-white">Login</Link>
                                <Link to="/register" className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-md font-semibold">Register</Link>
                            </>
                        )}
                    </div>
                </header>

                <section className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <h1 className="text-5xl font-extrabold leading-tight">
                            Build together, live.
                            <span className="block text-emerald-300">A real-time collaborative IDE.</span>
                        </h1>
                        <p className="mt-6 text-lg text-gray-300">
                            CollabIDE lets teams code simultaneously, review changes, and ship faster
                            without heavy setup. Share a link, start editing, and stay in sync.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row gap-4">
                            {isAuthenticated ? (
                                <>
                                    <Link
                                        to="/create"
                                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-semibold shadow-lg"
                                    >
                                        Create Session
                                    </Link>
                                    <Link
                                        to="/join"
                                        className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg font-semibold"
                                    >
                                        Join Session
                                    </Link>
                                    <Link
                                        to="/create"
                                        className="px-6 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg font-semibold"
                                    >
                                        Open Local Folder (Beta)
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/register"
                                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-semibold shadow-lg"
                                    >
                                        Get Started
                                    </Link>
                                    <Link
                                        to="/login"
                                        className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg font-semibold"
                                    >
                                        Login
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 shadow-2xl">
                        <h3 className="text-xl font-semibold mb-4">What you can do</h3>
                        <ul className="space-y-4 text-gray-300">
                            <li>
                                <div className="font-semibold text-white">Real-time collaboration</div>
                                <div className="text-sm text-gray-400">Edit together with live sync and presence.</div>
                            </li>
                            <li>
                                <div className="font-semibold text-white">Session links</div>
                                <div className="text-sm text-gray-400">Share a link and start instantly.</div>
                            </li>
                            <li>
                                <div className="font-semibold text-white">Operational Transformation</div>
                                <div className="text-sm text-gray-400">Conflict-free edits under concurrency.</div>
                            </li>
                            <li>
                                <div className="font-semibold text-white">Local workflow ready</div>
                                <div className="text-sm text-gray-400">Open folders, edit, and save back.</div>
                            </li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default LandingPage;
