require('dotenv').config();
const { createZoomMeeting } = require('./utils/zoomHelper');

async function test() {
    try {
        const result = await createZoomMeeting({
            topic: 'Test',
            startTime: new Date("2020-01-01T10:00:00Z").toISOString(),
            duration: 30,
            teacherEmail: 'fake@example.com'
        });
        console.log("Success:", result);
    } catch (e) {
        console.error("Error:", e.message);
    }
}
test();
