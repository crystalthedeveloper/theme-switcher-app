//pages/select-site.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function SelectSite() {
  const [sites, setSites] = useState([]);
  const [pages, setPages] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedPage, setSelectedPage] = useState('');
  const [token, setToken] = useState('');
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('wf_token');
    if (!stored) return;
    setToken(stored);

    fetch('https://api.webflow.com/v1/sites', {
      headers: { Authorization: `Bearer ${stored}` }
    })
      .then(res => res.json())
      .then(setSites);
  }, []);

  const handleSiteSelect = (e) => {
    const siteId = e.target.value;
    setSelectedSite(siteId);
    fetch(`https://api.webflow.com/v1/sites/${siteId}/pages`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setPages);
  };

  const handleInject = async () => {
    await fetch(`https://api.webflow.com/v1/sites/${selectedSite}/pages/${selectedPage}/custom-code`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        head: "",
        body: `<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>`,
        enabled: true
      })
    });

    router.push('/success');
  };

  return (
    <main style={{ textAlign: 'center', marginTop: '4rem' }}>
      <h2>Select Your Site & Page</h2>

      <select onChange={handleSiteSelect} value={selectedSite}>
        <option value="">Select Site</option>
        {sites.map(site => (
          <option key={site._id} value={site._id}>{site.name}</option>
        ))}
      </select>

      {pages.length > 0 && (
        <>
          <br /><br />
          <select onChange={e => setSelectedPage(e.target.value)} value={selectedPage}>
            <option value="">Select Page</option>
            {pages.map(page => (
              <option key={page._id} value={page._id}>{page.name}</option>
            ))}
          </select>
          <br /><br />
          <button onClick={handleInject} disabled={!selectedPage}>
            Inject Script
          </button>
        </>
      )}
    </main>
  );
}