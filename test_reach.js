import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('http://localhost:5173');
    console.log('Server is reachable at :5173, status:', res.status);
  } catch (e) {
    try {
      const res = await fetch('http://localhost:3000');
      console.log('Server is reachable at :3000, status:', res.status);
    } catch (e2) {
      console.log('Server not reachable at 5173 or 3000');
    }
  }
}
test();
