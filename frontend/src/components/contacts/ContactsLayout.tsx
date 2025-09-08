import React from 'react';
import Contacts from './Contacts';

const ContactsLayout: React.FC = () => {
  return (
    <div className="h-screen overflow-hidden">
      <main className="h-full overflow-y-auto">
        <div className="container mx-auto px-4 py-6">
          <Contacts />
        </div>
      </main>
    </div>
  );
};

export default ContactsLayout;
