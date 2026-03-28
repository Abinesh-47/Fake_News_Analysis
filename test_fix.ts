
import axios from 'axios';

async function testAnalysis() {
  try {
    console.log("🚀 Initiating Neural Analysis via Localhost...");
    const res = await axios.post('http://localhost:3000/api/analyze', {
      input: "Scientists discovered water on Mars in 2026"
    }, { timeout: 30000 });
    
    console.log("✅ Analysis Response Received:");
    console.log(JSON.stringify(res.data, null, 2));
    
    if (res.data.success) {
      console.log("\n[INTEGRITY] Test Passed. Results verified.");
    } else {
      console.log("\n[INTEGRITY] Test Failed. Backend returned success:false.");
    }
  } catch (err: any) {
    console.error("❌ Test Failed with Error:", err.message);
    if (err.response) console.error("Response Data:", err.response.data);
  }
}

testAnalysis();
