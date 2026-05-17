async function verify() {
    try {
        console.log("Logging in...");
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                signInId: 'student123',
                password: 'password123'
            })
        });

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log("Login successful. Token obtained.");

        console.log("Fetching dashboard data...");
        const dashboardRes = await fetch('http://localhost:5000/api/dashboard/student', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const dashboardData = await dashboardRes.json();
        console.log("Dashboard - Announcements:", dashboardData.data.announcements.length);

        console.log("Fetching live classes data...");
        const liveRes = await fetch('http://localhost:5000/api/classes/my-classes', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const liveData = await liveRes.json();
        console.log("Live Classes Count:", liveData.data.length);
        
        const liveNow = liveData.data.find(c => c.status === 'live');
        if (liveNow) {
            console.log("SUCCESS: Found a live class:", liveNow.topic);
        } else {
            console.log("WARNING: No live class found (check seeder).");
        }

        if (liveData.data.length > 0) {
            console.log("SUCCESS: Live Classes page is populated.");
        } else {
            console.log("FAILURE: Live Classes page is still empty.");
        }

    } catch (error) {
        console.error("Verification failed:", error.message);
    }
}

verify();
