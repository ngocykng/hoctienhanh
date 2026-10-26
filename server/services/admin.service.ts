import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const getSystemStatus = async () => {
    const userRes = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(userRes.rows[0].count);
    const timeRes = await pool.query('SELECT SUM(duration) as total FROM lessons');
    const totalTime = parseInt(timeRes.rows[0].total) || 0;
    const lessonRes = await pool.query('SELECT COUNT(*) as count FROM lessons WHERE completed = true');
    const completedLessons = parseInt(lessonRes.rows[0].count) || 0;
    const growthRate = Math.round((completedLessons / totalUsers) * 100);
    return { totalUsers, totalTime, completedLessons, growthRate };
}