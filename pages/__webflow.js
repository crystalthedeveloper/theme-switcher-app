// /pages/__webflow.js

export async function getServerSideProps({ res }) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ status: 'ok' }));
  return { props: {} };
}

export default function HealthCheck() {
  return null; // nothing rendered, just a health check
}
