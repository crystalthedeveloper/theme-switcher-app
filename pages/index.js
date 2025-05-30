//pages/index.js
export default function Home() {
    const clientId = process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_URL}/callback`);
    const scopes = 'sites:read pages:read pages:write custom_code:write';

    const oauthUrl = `https://webflow.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scopes}`;

    return (
        <main style={{ textAlign: 'center', marginTop: '5rem', padding: '0 1rem' }}>
            {/* Optional Logo */}
            <img
                src="/logo.png"
                alt="Crystal The Developer Logo"
                style={{ width: '100px', marginBottom: '1rem' }}
            />


            <h1>🎨 Theme Switcher for Webflow</h1>

            <p style={{ fontSize: '1.1rem', maxWidth: '480px', margin: '0 auto' }}>
                Seamlessly let your visitors toggle between light and dark mode — no coding required.
            </p>

            <a href={oauthUrl}>
                <button
                    style={{
                        padding: '12px 24px',
                        marginTop: '2rem',
                        fontSize: '1rem',
                        cursor: 'pointer'
                    }}
                >
                    Connect to Webflow
                </button>
            </a>
        </main>
    );
}
