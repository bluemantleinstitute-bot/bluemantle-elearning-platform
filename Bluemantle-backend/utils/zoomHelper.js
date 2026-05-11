const axios = require('axios');

/**
 * Zoom Server-to-Server OAuth Helper
 * Requires ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET in .env
 */

let zoomAccessToken = null;
let tokenExpiryTime = null;

const zoomAuthHeaders = (token) => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
});

const getZoomAccessToken = async () => {
    try {
        if (zoomAccessToken && tokenExpiryTime && Date.now() < tokenExpiryTime - 300000) {
            return zoomAccessToken;
        }

        const accountId = process.env.ZOOM_ACCOUNT_ID;
        const clientId = process.env.ZOOM_CLIENT_ID;
        const clientSecret = process.env.ZOOM_CLIENT_SECRET;

        if (!accountId || !clientId || !clientSecret) {
            throw new Error("Zoom credentials missing in environment variables.");
        }

        const tokenUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`;
        const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        const response = await axios.post(tokenUrl, {}, {
            headers: { 'Authorization': `Basic ${authHeader}` }
        });

        zoomAccessToken = response.data.access_token;
        tokenExpiryTime = Date.now() + (response.data.expires_in * 1000);

        return zoomAccessToken;
    } catch (error) {
        console.error("Error fetching Zoom access token:", error.response?.data || error.message);
        const detailedError = error.response?.data ? JSON.stringify(error.response.data) : error.message;
        throw new Error(`Failed to get Zoom access token. Detail: ${detailedError}`);
    }
};

/**
 * Create a Zoom meeting via API
 * @param {Object} options - { topic, startTime (ISO string), duration (minutes), teacherEmail }
 * @returns {Object} { meetingId, joinUrl, startUrl, password }
 */
exports.createZoomMeeting = async ({ topic, startTime, duration = 60, teacherEmail }) => {
    try {
        const token = await getZoomAccessToken();

        const payload = {
            topic: topic || "Live Class Session",
            type: 2, // Scheduled meeting
            start_time: startTime,
            duration: duration,
            timezone: "Asia/Kolkata",
            settings: {
                host_video: true,
                participant_video: true,
                join_before_host: true,
                mute_upon_entry: true,
                waiting_room: false,
                auto_recording: "cloud",
                audio: "both",
                allow_multiple_devices: false
            }
        };

        // Use "me" if no email, or specify the teacher's email as the meeting host
        const hostEndpoint = teacherEmail
            ? `https://api.zoom.us/v2/users/${encodeURIComponent(teacherEmail)}/meetings`
            : `https://api.zoom.us/v2/users/me/meetings`;

        let response;
        try {
            response = await axios.post(hostEndpoint, payload, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (initialErr) {
            // If there's an error using the teacher's email (e.g. not found, no cloud recording permission), fallback to 'me'
            if (teacherEmail && initialErr.response) {
                console.warn(`Zoom creation failed for ${teacherEmail} (${initialErr.response.data?.message || initialErr.response.data?.code}). Falling back to master account ('me').`);
                response = await axios.post(`https://api.zoom.us/v2/users/me/meetings`, payload, {
                    headers: zoomAuthHeaders(token)
                });
            } else {
                throw initialErr;
            }
        }

        const meeting = response.data;

        return {
            meetingId: meeting.id.toString(),
            joinUrl: meeting.join_url,
            startUrl: meeting.start_url, // Host URL (for teacher/admin)
            password: meeting.password,
            hostId: meeting.host_id,
            hostEmail: meeting.host_email || teacherEmail,
        };
    } catch (error) {
        console.error("Error creating Zoom meeting:", error.response?.data || error.message);
        const detailedError = error.response?.data ? JSON.stringify(error.response.data) : error.message;
        throw new Error(`Failed to create Zoom meeting. Detail: ${detailedError}`);
    }
};

/**
 * Fetch a short-lived ZAK for the actual Zoom meeting host.
 * The Meeting SDK can use this to start a meeting inside the embedded client.
 * If the Zoom account does not grant the token scope, callers can still fall
 * back to the normal Meeting SDK host signature or Zoom start_url.
 */
exports.getHostZak = async (hostEmailOrId) => {
    try {
        const token = await getZoomAccessToken();
        const zoomUser = hostEmailOrId || "me";
        const url = `https://api.zoom.us/v2/users/${encodeURIComponent(zoomUser)}/token?type=zak`;
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        return response.data?.token || null;
    } catch (error) {
        console.error(`Error fetching Zoom ZAK for ${hostEmailOrId || "me"}:`, error.response?.data || error.message);
        return null;
    }
};

/**
 * Get meeting participants and their duration
 * @param {string} meetingId The Zoom Meeting ID
 */
exports.getMeetingParticipants = async (meetingId) => {
    try {
        const token = await getZoomAccessToken();

        const url = `https://api.zoom.us/v2/report/meetings/${meetingId}/participants?page_size=300`;

        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        return response.data.participants;
    } catch (error) {
        console.error(`Error fetching participants for meeting ${meetingId}:`, error.response?.data || error.message);
        throw new Error("Failed to fetch meeting participants from Zoom");
    }
};

/**
 * Get cloud recording download links for a completed meeting
 * @param {string} meetingId
 */
exports.getMeetingRecordings = async (meetingId) => {
    try {
        const token = await getZoomAccessToken();

        const url = `https://api.zoom.us/v2/meetings/${meetingId}/recordings`;
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        return response.data.recording_files || [];
    } catch (error) {
        console.error(`Error fetching recordings for meeting ${meetingId}:`, error.response?.data || error.message);
        return [];
    }
};
/**
 * Update an existing Zoom meeting
 * @param {string} meetingId
 * @param {Object} options - { topic, startTime, duration }
 */
exports.updateZoomMeeting = async (meetingId, { topic, startTime, duration }) => {
    try {
        const token = await getZoomAccessToken();
        const url = `https://api.zoom.us/v2/meetings/${meetingId}`;
        
        const payload = {
            topic,
            type: 2,
            start_time: startTime,
            duration
        };

        await axios.patch(url, payload, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        
        return true;
    } catch (error) {
        console.error(`Error updating Zoom meeting ${meetingId}:`, error.response?.data || error.message);
        throw new Error("Failed to update Zoom meeting");
    }
};

/**
 * Delete a Zoom meeting
 * @param {string} meetingId
 */
exports.deleteZoomMeeting = async (meetingId) => {
    try {
        const token = await getZoomAccessToken();
        const url = `https://api.zoom.us/v2/meetings/${meetingId}`;

        await axios.delete(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        return true;
    } catch (error) {
        console.error(`Error deleting Zoom meeting ${meetingId}:`, error.response?.data || error.message);
        // We don't throw here to allow deleting from our DB even if Zoom delete fails (e.g. already deleted)
        return false;
    }
};
