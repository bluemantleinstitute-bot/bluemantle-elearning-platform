require('dotenv').config();
const { createZoomMeeting } = require('./utils/zoomHelper');

async function test() {
    try {
        const result = await createZoomMeeting({
            topic: 'Test',
            startTime: new Date().toISOString(),
            duration: 30,
            teacherEmail: 'ajay'
        });
        console.log("Success:", result);
    } catch (e) {
        console.error("Error:", e.message);
    }
}
test();
