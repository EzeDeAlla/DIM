import React from 'react';
import CreateUser from './CreateUser';

const CreateUserLayout: React.FC = () => {
  return (
    <div className="h-screen overflow-hidden">
      <main className="h-full overflow-y-auto">
        <div className="container mx-auto px-4 py-6 pb-20">
          <CreateUser />
        </div>
      </main>
    </div>
  );
};

export default CreateUserLayout;
