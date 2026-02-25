import React, { useState, useEffect } from 'react';

const ProfessionalDementiaNewsSection = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('http://164.92.157.146:8000/professional-dementia-news'); 
        if (!res.ok) throw new Error('Failed to fetch news');
        const data = await res.json();
        setArticles(data.articles || []);
      } catch (err) {
        console.error(err);
        setError('Unable to load news at this time.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading) {
    return <p>Loading latest clinical updates...</p>;
  }

  return (
    <section style={{ maxWidth: '800px', margin: '40px auto', padding: '24px', background: '#f9f9f9', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <h2 style={{ fontSize: '28px', marginBottom: '16px', color: '#004d99' }}>
        Latest Research & Clinical Updates in Dementia/Alzheimer's
      </h2>
      <p style={{ fontSize: '16px', color: '#555', marginBottom: '32px' }}>
        Curated for doctors, nurses, and healthcare professionals from peer-reviewed sources.
      </p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {articles.length === 0 && !error ? (
        <p>No recent updates available.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {articles.map((art, i) => (
            <li key={i} style={{ marginBottom: '28px', paddingBottom: '20px', borderBottom: i < articles.length - 1 ? '1px solid #eee' : 'none' }}>
              <a
                href={art.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '20px', fontWeight: 'bold', color: '#004d99', textDecoration: 'none' }}
              >
                {art.title}
              </a>
              {art.source && <span style={{ fontSize: '14px', color: '#777', marginLeft: '12px' }}>({art.source})</span>}
              <p style={{ fontSize: '15px', color: '#333', margin: '12px 0', lineHeight: '1.5' }}>
                {art.summary}
              </p>
              <small style={{ color: '#999' }}>{art.published}</small>
            </li>
          ))}
        </ul>
      )}

      <p style={{ fontSize: '13px', color: '#999', marginTop: '32px' }}>
        Sources: ScienceDaily, Nature, NEJM Journal Watch, Alzforum, and other professional research outlets.
      </p>
    </section>
  );
};

export default ProfessionalDementiaNewsSection;