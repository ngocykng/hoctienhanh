import { Request, Response } from 'express';
import pool from "@/server/db/pool";

export const getadminstatus = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT COUNT(*) as total FROM users');
        const totalUsers = result.rows[0].total;
        res.json({
            success: true,
            message: 'Thanh cong',
            data: {
                totalUsers: parseInt(totalUsers),
            }
        })
    } catch (error) {
        res.status(500).json({success: false, message: 'Lỗi server', error: error});
    }
}