

'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RedirectToStores() {
    const router = useRouter();
    
    // This component will redirect to the stores page,
    // which is the new central place for managing services.
    useEffect(() => {
        router.replace('/app/stores');
    }, [router]);

    return null; // Render nothing while redirecting
}

    