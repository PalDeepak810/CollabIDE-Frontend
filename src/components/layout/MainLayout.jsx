import React from 'react';
import TopBar from './TopBar';
import StatusBar from './StatusBar';

const MainLayout = ({ children }) => {
    return (
        <div className="flex flex-col h-screen bg-gray-950 text-gray-100">
            <TopBar />
            <div className="flex-1 overflow-hidden flex">
                {children}
            </div>
            <StatusBar />
        </div>
    );
};

export default MainLayout;
