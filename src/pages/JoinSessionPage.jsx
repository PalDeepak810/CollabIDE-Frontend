import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const JoinSessionPage = () => {
    const navigate = useNavigate();
    const [sessionId, setSessionId] = useState('');
    const [error, setError] = useState(null);
    const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;

    const extractSessionId = (value) => {
        const trimmed = value.trim();
        if (!trimmed) return '';
        const match = trimmed.match(uuidRegex);
        return match ? match[0] : trimmed;
    };

    const handleJoin = (e) => {
        e.preventDefault();
        const extracted = extractSessionId(sessionId);
        if (!extracted) {
            setError('Please enter a Session ID');
            return;
        }
        if (!uuidRegex.test(extracted)) {
            setError('Please enter a valid Session ID or full session link');
            return;
        }
        // Validation logic could go here (check if session exists via API)
        setError(null);
        navigate(`/session/${extracted}`);
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
            <div className="w-full max-w-md p-8 bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl">
                <h2 className="text-3xl font-bold mb-2 text-center">Join Session</h2>
                <p className="text-gray-400 text-center mb-8">Enter the Session ID to start collaborating</p>

                <form onSubmit={handleJoin} className="space-y-6">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Session ID</label>
                        <input
                            type="text"
                            value={sessionId}
                            onChange={(e) => setSessionId(e.target.value)}
                            placeholder="Session ID or full session link"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        />
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm">{error}</div>
                    )}

                    <button
                        type="submit"
                        className="w-full py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg font-bold text-lg transition-colors"
                    >
                        Join Session
                    </button>

                    <div className="text-center">
                        <button type="button" onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-300 text-sm">Back</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JoinSessionPage;
