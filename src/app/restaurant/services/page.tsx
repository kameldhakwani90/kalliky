

'use client';

import { useRouter } from 'next/navigation';

export default function RedirectToStores() {
    const router = useRouter();
    // This component will redirect to the stores page,
    // which is the new central place for managing services.
    if (typeof window !== 'undefined') {
        router.replace('/restaurant/stores');
    }
    return null; // Render nothing while redirecting
}
