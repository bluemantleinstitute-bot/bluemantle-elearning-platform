const User = require("../models/user");
const bcrypt = require("bcryptjs");

const generateSignInId = async (prefix) => {
    let isUnique = false;
    let signInId;
    while (!isUnique) {
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        signInId = `${prefix}-${randomNum}`;
        const existing = await User.findOne({ signInId });
        if (!existing) isUnique = true;
    }
    return signInId;
};

exports.createTeacher = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Validate inputs
        if (!name || !password) {
            return res.status(400).json({ success: false, message: "Name and password are required" });
        }

        // Check if email already exists (only if provided)
        if (email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ success: false, message: "Email already exists" });
            }
        }

        const signInId = await generateSignInId("TEA");

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create teacher
        const newTeacher = new User({
            name,
            email: email || undefined,
            signInId,
            password: hashedPassword,
            role: "teacher"
        });

        await newTeacher.save();

        // Convert to object and exclude password
        const teacherData = newTeacher.toObject();
        delete teacherData.password;

        res.status(201).json({
            success: true,
            message: "Teacher created successfully",
            data: teacherData
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createStudent = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Validate inputs
        if (!name || !password) {
            return res.status(400).json({ success: false, message: "Name and password are required" });
        }

        // Check if email already exists (only if provided)
        if (email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ success: false, message: "Email already exists" });
            }
        }

        const signInId = await generateSignInId("STU");

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create student
        const newStudent = new User({
            name,
            email: email || undefined,
            signInId,
            password: hashedPassword,
            role: "student"
        });

        await newStudent.save();

        // Convert to object and exclude password
        const studentData = newStudent.toObject();
        delete studentData.password;

        res.status(201).json({
            success: true,
            message: "Student created successfully",
            data: studentData
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getTeachers = async (req, res) => {
    try {
        // Fetch all teachers, only return specified fields
        const teachers = await User.find({ role: "teacher" }).select("name email signInId createdAt");

        res.json({
            success: true,
            message: "Teachers fetched successfully",
            data: teachers
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
