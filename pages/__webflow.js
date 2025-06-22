// pages/__webflow.js

export async function getServerSideProps({ res }) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify({ status: 'ok' }));
  return { props: {} };
}

export default function WebflowHealthCheck() {
  return null; // Used for Webflow's health check endpoint
}