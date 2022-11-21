import React, { Suspense } from 'react';
import ProjectStar from './ProjectStar';

const App = () => {
  return (
    <div>
      <h1>Stars</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <ProjectStar />
      </Suspense>
    </div>
  );
};

export default App;
