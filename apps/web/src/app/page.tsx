import { redirect } from 'next/navigation';
import { HOME_PATH } from '@/lib/auth/auth.constants';

const RootPage = () => redirect(HOME_PATH);

export default RootPage;
