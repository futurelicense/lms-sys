import { Outlet } from 'react-router-dom';

export const ErrorLayout = () => (
  <main
    className="u-flex u-flex-col u-items-center u-justify-center"
    style={{ minHeight: '100vh' }}
  >
    <Outlet />
  </main>
);

export default ErrorLayout;
