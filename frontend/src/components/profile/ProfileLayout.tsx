import React from 'react';
import Profile from './Profile';

const ProfileLayout: React.FC = () => {
  return (
    <div className="h-screen overflow-hidden">
      <main className="h-full overflow-y-auto">
        <div className="container mx-auto px-4 py-6">
          <Profile />
        </div>
      </main>
    </div>
  );
};

export default ProfileLayout;